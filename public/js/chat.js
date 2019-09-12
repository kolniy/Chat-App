const socket = io()

// dom elements
const $messageForm = document.querySelector('#sendMessage')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true })

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild  // new message element

    // height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight  

    if(containerHeight - newMessageHeight <= scrollOffset){ // check if we have scrolled to the bottom of the page
        $messages.scrollTop = $messages.scrollHeight
    }
}

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const textMessage = e.target.message.value  

    socket.emit('sendMessage', textMessage, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
       if(error){
           return console.log(error)
       }

       console.log('Message Delivered')
    })
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html) 
    autoScroll()
})

socket.on('locationMessage', (location) => {
    console.log(location)
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        url : location.url,
        createdAt : moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})  

socket.on('roomData', ({ room, users }) => {
     const html = Mustache.render(sidebarTemplate, {
        room,
        users
     })
     $sidebar.innerHTML = html
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const {latitude, longitude} = position.coords
        const location = {
            latitude,
            longitude
        }
        socket.emit('sendLocation', location, (message) => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})