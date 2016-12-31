var SIGNALING_SERVER = "http://62.84.111.201:3030";
var DEFAULT_ROOM = 'OfficialRoom'
var ICE_SERVERS = [
  {url:"stun:stun.l.google.com:19302"}
];

var hashes = window.location.hash.split('#')
var roomName = getParameterByName('room')
var signalingServerAddress = getParameterByName('signalingServerIp')
if (roomName) DEFAULT_ROOM = roomName;
if (signalingServerAddress) SIGNALING_SERVER = signalingServerAddress;

var signaling_socket = null;   /* our socket.io connection to our webserver */
var HostPeer = null;
var HostId = false;
var peers = {};                /* keep track of our peerConnection connections, indexed by peer_id (aka socket.io id) */
var activePeers = [];
var room = {};
var isServer = false;

function getParameterByName(name, url) {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return null;
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function disconnect(){
  if (tanksroom) tanksroom.destructThemAll();
  HostPeer = null;
  HostId = false;
  peers = {};                /* keep track of our peerConnection connections, indexed by peer_id (aka socket.io id) */
  activePeers = [];
  isServer = false;
  signaling_socket.close();
}

function initWebRtc() {
  HideModal();
  console.log("Connecting to signaling server");
  signaling_socket = io.connect(SIGNALING_SERVER);
  signaling_socket.on('connect', function() {
      console.log("Connected to signaling server");
      join_chat_channel(DEFAULT_ROOM, {'whatever-you-want-here': 'stuff'});
  });
  signaling_socket.on('disconnect', function() {
      console.log("Disconnected from signaling server");
      /* Tear down all of our peerConnection connections and remove all the
       * media divs when we disconnect */
      for (peer_id in peers) {
          peers[peer_id].recevingDataChannel.close();
          peers[peer_id].sendDataChannel.close();
      }
      peers = {};
  });

  function join_chat_channel(room, userdata) {
      signaling_socket.emit('join', {"channel": room, "userdata": userdata});
  }
  function part_chat_channel(channel) {
      signaling_socket.emit('part', channel);
  }
  /**
  * When we join a group, our signaling server will send out 'addPeer' events to each pair
  * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
  * in the channel you will connect directly to the other 5, so there will be a total of 15
  * connections in the network).
  */
  signaling_socket.on('Servers', function(list){
    console.log(list)
    var sl = $('#ServersList');
    sl[0].innerHTML = '';

    for (var l in list)
      sl[0].innerHTML += '<ul class=\"beads\" id=\'ServerListUl\'><li id=\'' + list[l] + '\'><a onclick=\"DEFAULT_ROOM = this.innerHTML; container.innerHTML = \'\'; disconnect();initWebRtc();\">' + list[l] + '</a></li></ul>';
  });

  signaling_socket.on('NowYouAreHost', function(){
    initTanksRoomServer();
    isServer = true;
    signaling_socket.emit('getServers');
    console.warn('Now I am a HOST')
    $('#Header')[0].innerHTML = 'Room: ' + DEFAULT_ROOM

    //room object
    room = {
      players: activePeers,
      teams: []
    }
  });
  signaling_socket.on('JoinedToTheRoom', function(config){
    console.warn('I have joined to the room. HostId:',config.hostId)
    HostId = config.hostId
    $('#Header')[0].innerHTML = 'Room: ' + DEFAULT_ROOM
  });

  signaling_socket.on('RoomClosed', function(){
    console.warn('We are sorry, but host has left the room')
	document.location.href = "http://62.84.111.201:3030";
  });

  function HostFounded(obj){
    HostPeer = obj;
    console.warn('Host Founded:', HostPeer)
    obj.sendDataChannel.onopen = initTanksRoomClient;
  }
  signaling_socket.on('addPeer', function(config) {
	  
      //console.log('Signaling server said to add peerConnection:', config);
      var peer_id = config.peer_id;
      if (peer_id in peers) {
          /* This could happen if the user joins multiple channels where the other peerConnection is also in. */
          //console.log("Already connected to peerConnection ", peer_id);
          return;
      }
      var peer_connection = new RTCPeerConnection(
          {"iceServers": ICE_SERVERS},
          {"optional": [{"DtlsSrtpKeyAgreement": true}]} /* this will no longer be needed by chrome
                                                          * eventually (supposedly), but is necessary
                                                          * for now to get firefox to talk to chrome */
      );
      peers[peer_id] = {};
      peers[peer_id].peerConnection = peer_connection;
      var sdchannel = peer_connection.createDataChannel(peer_id);

      sdchannel.onopen = function() {
        //console.log('SendChannel opened!',sdchannel);
        sdchannel.send(JSON.stringify({type: 'notification', value:'Hi!'}));
        activePeers.push(sdchannel.label)
      };
      peers[peer_id].peerConnection.ondatachannel = function(rdchannel) {
        //console.log('ReceiveChannel opened!',rdchannel.channel);
        /*rdchannel.channel.onmessage = function(e){
          console.warn('MESSAGE!', e);
        }*/
        peers[peer_id].recevingDataChannel = rdchannel.channel;
        if (isServer) AcceptClient(peers[peer_id]);

        //newPlayer(rdchannel.channel, sdchannel);
      }
      peers[peer_id].sendDataChannel = sdchannel;

      if (HostId && HostId == peer_id)
        HostFounded(peers[peer_id]);

      peer_connection.onicecandidate = function(event) {
          if (event.candidate) {
              signaling_socket.emit('relayICECandidate', {
                  'peer_id': peer_id,
                  'ice_candidate': {
                      'sdpMLineIndex': event.candidate.sdpMLineIndex,
                      'candidate': event.candidate.candidate
                  }
              });
          }
      }

      /* Only one side of the peerConnection connection should create the
       * offer, the signaling server picks one to be the offerer.
       * The other user will get a 'sessionDescription' event and will
       * create an offer, then send back an answer 'sessionDescription' to us
       */
      if (config.should_create_offer) {
          //console.log("Creating RTC offer to ", peer_id);
          peer_connection.createOffer(
              function (local_description) {
                  //console.log("Local offer description is: ", local_description);
                  peer_connection.setLocalDescription(local_description,
                      function() {
                          signaling_socket.emit('relaySessionDescription',
                              {'peer_id': peer_id, 'session_description': local_description});
                          //console.log("Offer setLocalDescription succeeded");
                      },
                      function() { Alert("Offer setLocalDescription failed!"); }
                  );
              },
              function (error) {
                  console.error("Error sending offer: ", error);
              });
      }
  });

  /**
   * Peers exchange session descriptions which contains information
   * about their audio / video settings and that sort of stuff. First
   * the 'offerer' sends a description to the 'answerer' (with type
   * "offer"), then the answerer sends one back (with type "answer").
   */
  signaling_socket.on('sessionDescription', function(config) {
      //console.log('Remote description received: ', config);
      var peer_id = config.peer_id;
      var peerConnection = peers[peer_id].peerConnection;
      var remote_description = config.session_description;
      //console.log(config.session_description);
      var desc = new RTCSessionDescription(remote_description);
      var stuff = peerConnection.setRemoteDescription(desc,
          function() {
              //console.log("setRemoteDescription succeeded");
              if (remote_description.type == "offer") {
                  //console.log("Creating answer");
                  peerConnection.createAnswer(
                      function(local_description) {
                          //console.log("Answer description is: ", local_description);
                          peerConnection.setLocalDescription(local_description,
                              function() {
                                  signaling_socket.emit('relaySessionDescription',
                                      {'peer_id': peer_id, 'session_description': local_description});
                                  //console.log("Answer setLocalDescription succeeded");
                              },
                              function() { Alert("Answer setLocalDescription failed!"); }
                          );
                      },
                      function(error) {
                          console.error("Error creating answer: ", error);
                          console.warn(peerConnection);
                      });
              }
          },
          function(error) {
              console.error("setRemoteDescription error: ", error);
          }
      );
      //console.log("Description Object: ", desc);
  });

  /**
  * The offerer will send a number of ICE Candidate blobs to the answerer so they
  * can begin trying to find the best path to one another on the net.
  */
 signaling_socket.on('iceCandidate', function(config) {
     var peer = peers[config.peer_id];
     var ice_candidate = config.ice_candidate;
     peer.peerConnection.addIceCandidate(new RTCIceCandidate(ice_candidate));
 });
 /**
  * When a user leaves a channel (or is disconnected from the
  * signaling server) everyone will recieve a 'removePeer' message
  * telling them to trash the media channels they have open for those
  * that peerConnection. If it was this client that left a channel, they'll also
  * receive the removePeers. If this client was disconnected, they
  * wont receive removePeers, but rather the
  * signaling_socket.on('disconnect') code will kick in and tear down
  * all the peerConnection sessions.
  */
 signaling_socket.on('removePeer', function(config) {
     //console.log('Signaling server said to remove peerConnection:', config);
     var peer_id = config.peer_id;
     var index = activePeers.indexOf(peer_id);
     if (index != -1) activePeers.splice(index,1)

     if (peer_id in peers) {
       //console.log(peers[peer_id])
       if (peers[peer_id].peerConnection) peers[peer_id].peerConnection.close();
       if (peers[peer_id].sendDataChannel) peers[peer_id].sendDataChannel.close();
       if (peers[peer_id].recevingDataChannel) peers[peer_id].recevingDataChannel.close();
       if (peers[peer_id].linkedTank) peers[peer_id].linkedTank.destructSelf();
       else console.warn('Какая жалость.. Он даже не успел танком обзавестись :(')
     }
	 
     delete peers[peer_id];
 });
}
