import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, IconButton, Badge } from '@mui/material';
import styles from "../style/VideoComponent.module.css"; // import CSS module
import { io } from "socket.io-client";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import { useNavigate } from 'react-router-dom';
const server_url="http://localhost:8080";

var connections = {};

const peerConfigConnections ={
    "iceServers":[
        {"urls": "stun:stun.l.google.com:19302"} 
    ]
}


export default function VideoMeetComponent(){
 
    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState();
  
    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();
    
    let [showModel, setModel] = useState(true);
   
    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setaskUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([]);

     // ✅ PASTE THIS
const getPermission = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        setVideoAvailable(stream.getVideoTracks().length > 0);
        setAudioAvailable(stream.getAudioTracks().length > 0);
        setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
        window.localStream = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error(err);
        setVideoAvailable(false);
        setAudioAvailable(false);
    }
}

let routeTo = useNavigate();


    useEffect(() => {
    getPermission();
}, [])


     

     let getUserMediaSuccess = (stream) => {
          try {
              if (window.localStream && window.localStream.getTracks) {
                  window.localStream.getTracks().forEach(track => { track.stop() })
              }
          } catch (e) { console.log(e) }

          window.localStream = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;

          for (let id in connections) {
              if (id === socketIdRef.current) continue;
              try { connections[id].addStream(window.localStream) } catch (e) {}

              connections[id].createOffer().then((description) => {
                  connections[id].setLocalDescription(description)
                      .then(() => {
                          socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                      })
                      .catch(e => console.log(e))
              })
          }

          stream.getTracks().forEach(track => track.onended = () => {
              setVideo(false)
              setAudio(false)

              try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track =>track.stop())
              }catch(e){console.log(e) }

                //todo: blackSlience
                let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                 window.localStream = blackSilence()
                 localVideoRef.current.srcObject = window.localStream;
                        


              for(let id in connections){
                if(id === socketIdRef.current) continue;

                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description)=>{
                    connections[id].setLocalDescription(description)
                    .then(()=>{
                        socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                    })
                    .catch(e=>console.log(e))
                })

              }

          })
      }

        let silence = () => {
            let ctx = new AudioContext()
            let oscillator = ctx.createOscillator();

            let dst = oscillator.connect(ctx.createMediaStreamDestination()); 


            oscillator.start();
            ctx.resume();
            return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
        }

        let black = ({width = 640, height = 480} ={})=>{
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
            canvas.getContext("2d").fillRect(0,0, width, height);
            let stream = canvas.captureStream();
            return Object.assign(stream.getVideoTracks()[0],{enabled: false})

        }


   let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
        navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
            .then(getUserMediaSuccess)
            .catch((e) => console.log(e))
    } else {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
    }
}
            
        useEffect(()=>{

          if (video !== undefined || audio !== undefined) {
        getUserMedia();
         }  
         },[audio,video])    
 
  //todo
   
  let gotMessgaeFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if(fromId !== socketIdRef.current){
        if(signal.sdp){
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(()=>{
                if(signal.sdp.type === "offer"){
                    connections[fromId].createAnswer().then((description)=>{
                        connections[fromId].setLocalDescription(description).then(()=>{
                            socketRef.current.emit("signal", fromId, JSON.stringify({"sdp":connections[fromId].localDescription}))
                        }).catch(e=>console.log(e ))
                    }).catch(e=>console.log(e))
                }
            }).catch(e=>console.log(e))
        }

        if(signal.ice){
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e=>console.log(e))
        }
       

    }
  }


  let addMessage = (data, sender, socketIdSender) => {

    setMessages((preMessages)=>[
        ...preMessages,
        {sender: sender, data: data}
    ]);
        if(socketIdSender !== socketIdRef.current){
            setNewMessages((preMessages)=>preMessages + 1)
        }
  } 

  

    let connectToSocketServer = ()=>{
        socketRef.current = io.connect(server_url,  { secure: false})
         
        socketRef.current.on('signal', gotMessgaeFromServer);
        
        socketRef.current.on("connect",()=>{

         socketRef.current.emit("join-call", window.location.href)

         socketIdRef.current = socketRef.current.id

         socketRef.current.on("chat-message", addMessage )

         socketRef.current.on("user-left",(id)=> {
            setVideos((videos)=>videos.filter((video)=>video.socketId !== id))
         })

         socketRef.current.on("user-joined", (id,clients)=>{
            clients.forEach((socketListId)=>{
                connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                connections[socketListId].onicecandidate = (event)=>{
                    if(event.candidate != null){
                        socketRef.current.emit("signal", socketListId, JSON.stringify({"ice": event.candidate}))
                    }
                }

                connections[socketListId].onaddstream = (event)=>{
 
                    let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                    
                    if(videoExists){
                        setVideos(videos =>{
                            const updatedVideos = videos.map(video =>
                              video.socketId === socketListId ? { ...video, stream: event.stream } : video  
                            );
                            videoRef.current = updatedVideos; 
                            return updatedVideos;
                        })
                    }else{

                        let newVideo ={
                            socketId: socketListId,
                            stream: event.stream,
                            autoPlay: true,
                            playsInline: true
                        }

                        setVideos(videos =>{
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        })
                    }
                };

                if(window.localStream !== undefined && window.localStream !== null){
                    connections[socketListId].addStream(window.localStream);
                }else{
                    //TODO: blackSlience
                    // let blackSlience = 

                  let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)                }

            })

            if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue
                       try{
                          connections[id2].addStream(window.localStream)
                       }catch(e){}

                       connections[id2].createOffer().then((description)=>{
                        connections[id2].setLocalDescription(description)
                        .then(()=>{
                            socketRef.current.emit("signal", id2, JSON.stringify({"sdp":connections[id2].localDescription}))
                        })
                        .catch(e=> console.log(e)) 
                       })
                }
            }



         })
        })



    }

    let getMedia = () =>{
      setVideo(videoAvailable);
      setAudio(audioAvailable);
      connectToSocketServer();
    }

    let handleVideo  = () =>{
        setVideo(!video);
    }

    let handleAudio = () =>{
        setAudio(!audio);
    }
 
    let habdleEndCall = () => {
    try{
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop())
    }catch(e){}
    
     routeTo("/home")
    
  }

    let  getDisplayedMediaSucess = (stream) => {
        try{
            window.localStream.getTracks().forEach(track => track.stop())
        } catch(e) {console.log(e)}
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if (id === socketRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description)=>{
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp":connections[id].localDescription}))
                })
                .catch(e=>console.log(e))
            })
        }
         stream.getTracks().forEach(track => track.onended = () => {
              setScreen(false)

              try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track =>track.stop())
              }catch(e){console.log(e) }

                //todo: blackSlience
                let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                 window.localStream = blackSilence()
                 localVideoRef.current.srcObject = window.localStream;
                        
             getUserMedia(); 

          })
            }

    let getDisplayedMedia = () => {
        if(screen){
            if(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia){
                navigator.mediaDevices.getDisplayMedia({video: true})
                .then(getDisplayedMediaSucess)
                .catch((e)=>console.log(e))
            }
        }
    }

  useEffect(()=>{
        if(screen !== undefined){
            getDisplayedMedia();
        }
    },[screen])

    let handleScreen = () => {
        setScreen(!screen)
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }
    
    return(
        <div>
        
            {askForUsername === true ? <div>
            
            <h2>Enter into lobby</h2>
            <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} />
    
             <Button variant="contained" onClick={() => {
                setaskUsername(false);
                getMedia();
            }}>Connect</Button>

               <div>
       <video ref={localVideoRef} autoPlay muted playsInline></video>

               </div>
            </div>: 
  
  <div className={styles.meetVideoContainer}>

            {showModel ? <div className={styles.chatRoom}>
               <div className={styles.chatContainer}>
                <h1>Chat</h1>
                    <div className={styles.chattingDisplay}>
                      
                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}
                    </div>

                
                            <div className={styles.chattingArea}>
                                <TextField  value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                                <Button variant='contained' onClick={sendMessage}  >Send</Button>
                            </div>
            </div>
            </div>:<></>}   
            

  
            <div className={styles.buttonContainers}>
                 <IconButton  onClick={handleVideo} style={{ color: "white"}}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

            <IconButton  onClick={habdleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>
            <IconButton  onClick={handleAudio} style={{ color: "white" }}>
                    {audio === true ? <MicIcon /> : <MicOffIcon />}
                </IconButton>

                {screenAvailable === true ? 
                <IconButton onClick={handleScreen} style={{color: "white"}}>
                    {screen === true ? <ScreenShareIcon/> : <StopScreenShareIcon/>}
                </IconButton>: <></>}
        
                    <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={()=> setModel(!showModel)} style={{ color: "white" }}>
                                <ChatIcon />                      
                                  </IconButton>
                        </Badge>
            
            </div>
            
            <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>
            <div  className={styles.confrenceView}>
            {videos.map((video)=>(
                <div key={video.socketId}>
                 
                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
 
                </div>
            ))}
               </div>
            </div>
        }

        </div>
    )
}