const socketURL = 'wss://fcfcqpkf2a.execute-api.us-east-1.amazonaws.com/production';

const input_text = $('#input_text');

let socket = new WebSocket(socketURL);

let connected = false;
let connectionid = '';

let partnerconnected = false;
let partnerid = '';

socket.onopen = (event) => {
  hello_message = '{"type": "whoami"}';
  socket.send(hello_message);
}


function add_message(message, is_me) {
  conv = $('#conversation');
  const msgclass = is_me ? 'chatme' : 'chatpartner';
  conv.append(`<p class="chatitem ${msgclass}">${message}</p>`)
  conv.scrollTop(conv.prop("scrollHeight"));
}


function update_connection_status() {
  if (connected) {
    $('disconnectmsg').hide();
    $('#connection_status2').removeClass('disconnected');
    $('#connection_status2').addClass('connected');
    $('#connection_status2').text('secure connection established.');
  } else {
    $('#connection_status2').removeClass('connected');
    $('#connection_status2').addClass('disconnected');
    $('#connection_status2').text('connection lost.');
  }

  if (partnerconnected) {
    $('#callstatus').attr('src', 'crypconvo_call_red.png');
    $('#connection_status1').text('Online');
    $('#disconnectmsg').hide();
  } else {
    $('#connection_status1').text('Offline');
    $('#callstatus').attr('src', 'crypconvo_call_grey.png');
  }
}


function change_callstatus() {
  if (partnerconnected) {
    const disconnect_msg = {
      'type': 'disconnect'
    }
    socket.send(JSON.stringify(disconnect_msg));
    partnerconnected = false;
    update_connection_status();
  } else {
    const partner_request_msg = {
      'type': 'partner_request_msg',
      'connectionid': connectionid
    }
    socket.send(JSON.stringify(partner_request_msg));
  }
}


socket.onmessage = (event) => {
  data = JSON.parse(event.data);

  switch(data['type']) {
    case 'connection_status':
      if (data['status'] == 'connected') {
        connected = true;
        connectionid = data['connectionid'];
        update_connection_status();
        const partner_request_msg = {
          'type': 'partner_request_msg',
          'connectionid': connectionid
        }
        socket.send(JSON.stringify(partner_request_msg));
      }
      break;
    case 'partner_status':
      partnerconnected = data['status'];
      action = data['action'];
      update_connection_status();
      if (data['status']) {
        partnerid = data['partnerid'];
      } else {
        if (action == 'partner_disconnected') {
          $('#disconnectmsg').show();
        }
        partnerid = '';
      }
      break;

    case 'message':
      if (data['sender'] == connectionid) {
        add_message('UNKNOWN: ' + data['message'], true);
      }
      if (data['sender'] == partnerid) {
        add_message('UNKNOWN: ' + data['message'], false);
      }
      break;
  }
}


socket.onclose = (event) => {
  if (!navigator.onLine) {
    connected = false;
    update_connection_status();
    alert('Connection to server interrupted. Refresh the page to reconnect.');
  }
}


setInterval(function() {
  if (socket.readyState == WebSocket.OPEN) {
    data = {
      'type': 'ping'
    }
    socket.send(JSON.stringify(data));
  }
}, 300000);


function process_form(e) {
  if (e.preventDefault) e.preventDefault();
  if (connected && partnerid != '') { // only process the form input if the connection is active and a partner is connected
    const data = {
      'type': 'message',
      'message': input_text.val()
    }
    socket.send(JSON.stringify(data));
  }
  // always clear the text box
  input_text.val('');
  return false;
}


const form = document.getElementById('mainform');
if (form.attachEvent) {
  form.attachEvent("submit", process_form);
} else {
  form.addEventListener("submit", process_form);
}

document.addEventListener("DOMContentLoaded", async function() {
  $('#disconnectmsg').hide();
  $('#disconnectmsg').addClass('disconnectmsg1');

  $('#callstatus_btn').on('click', change_callstatus);

});
