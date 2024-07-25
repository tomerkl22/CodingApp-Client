import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; // choose the theme you like
import '../styles/CodeBlock.css';
import SmileyFace from '../images/smileyFace.jpg';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const generateUniqueClientId = () => uuidv4();

export default function CodeBlock() {
  const location = useLocation();
  const codeBlock = location.state.codeBlock;
  const [code, setCode] = useState(codeBlock ? codeBlock.code : '');
  const [role, setRole] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const clientRef = useRef(null);


  useEffect(() => {    
    let clientId = generateUniqueClientId();     
    // Activate the STOMP client
    console.log('Component mounted');
    console.log('Activating STOMP client');
    //stompClient.activate();
      const socket = new SockJS('https://codingapp-server-9ac053720d46.herokuapp.com/ws');
      const stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
          console.log(str);
        },
        onConnect: () => {
          console.log('Connected');
          stompClient.publish({
            destination: '/app/assignRole',
            body: JSON.stringify({"clientId": clientId})
          })
          // Subcribe to submit code
          stompClient.subscribe('/topic/submit', (message) => {
            if (message.body) {
              let messageBody = JSON.parse(message.body)
              if (messageBody){
                setSuccess(true);
              }
            }
          });
          // Subscribe to assign role
          stompClient.subscribe('/topic/assignRole', (message) => {
            if(message.body){
              let messageBody = JSON.parse(message.body)
              console.log(messageBody.id);
              if (messageBody.id === clientId){
                setRole(messageBody.role)
                console.log("Role changed", messageBody.id, messageBody.role);
              }
            }
          })
          // Subscribe to a topic
          stompClient.subscribe('/topic/code', (message) => {
            if (message.body) {
              let messageBody = JSON.parse(message.body)
              setCode(messageBody.code);
            }
          });
        },
        onStompError: (frame) => {
          console.error('Broker reported error: ' + frame.headers['message']);
          console.error('Additional details: ' + frame.body);
        },
      });
      stompClient.activate();
      clientRef.current = stompClient;  
    
  
   return () => {
    console.log('Component unmounting');
    if (clientRef.current) {
      clientRef.current.publish({
        destination: '/app/unAssignRole',
        body: JSON.stringify({ "clientId": clientId })
      });
      clientRef.current.deactivate();
      console.log('Deactivating STOMP client');
    }
   } ;
  }, []);



  const handleCodeChange = (newCode) => {
    if (role === 'student') {
      setCode(newCode);
      if (clientRef.current){
      clientRef.current.publish({
        destination: '/app/code',
        body: JSON.stringify({
          "id" : codeBlock.id,
          "title" : codeBlock.title,
          "code" : newCode
        })
      })
    }}
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    clientRef.current.publish({
      destination: '/app/submit',
      body: JSON.stringify({
          "id" : codeBlock.id,
          "title" : codeBlock.title,
          "code" : code
    })
  });
};

  return (
    <div className="code-container"> 
      <h1>{codeBlock.title}</h1>
      <div>
        <Editor
          className="editor"
          value={code}
          onValueChange={handleCodeChange}
          highlight={code => highlight(code, languages.js)}
          padding={10}
          readOnly={role === 'mentor'}
        />
      </div>
      <div>
        {role === 'student' && <button className="submit-button" onClick={handleSubmit} >Submit</button> }
      </div>
      <div>
        {role === 'mentor' && success && <p>The Student Succeeded!</p>}
        {role === 'mentor' && isSubmitted && !success && <p>The Student Failed!</p>}
        {success && <img src={SmileyFace} alt='smiley face' className='img'/>  }
        {role === 'student' && isSubmitted && success && <div> <p>Congratulations! You have successfully completed the challenge!</p> </div>}
        {role === 'student'&& isSubmitted && !success && <div> <p>Sorry, you did not pass the challenge. Please try again.</p> </div>} 
      </div>
    </div>
  );
};
