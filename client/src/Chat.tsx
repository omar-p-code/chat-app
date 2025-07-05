import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
const server = 'https://chat-app-production-7751.up.railway.app';


const socket = io(server);

interface UserData {
   name: string;
   user: string;
   password: string;
};

interface Props {
   vars: {
      state: 'login' | 'chat';
      setState: (state: 'login' | 'chat') => void,
      userData: {
         name: string;
         user: string;
         password: string;
      };
      setUserData: (data: UserData) => void
   }
}

type ChatState = Array<{
      user: string;
      message: string;
   }> | null;



export default function Chat(props: Props): React.ReactElement{
   const { setState, userData } = props.vars
   const [ chats, setChats ] = useState<ChatState>()
   const input = useRef<HTMLInputElement>(null);
   const chat = useRef<HTMLDivElement>(null);
   const alert = useRef<HTMLDivElement>(null);
   const interval = useRef<unknown>(null);
   const [alerts, setAlerts] = useState<string[]>([])
   const lastMessage = useRef<HTMLDivElement>(null);
   const [placeHolder, setPlaceHolder] = useState('Type a message...');

   useEffect(() => {
      if (localStorage.token) {
         axios.get(`${server}/chat`, {
            headers: {
               "Content-Type": 'application/json',
               "Authorization": `Bearer ${localStorage.token}`
            }
         }).then((response) => {
            if (response.status === 200) {
               console.log(response.data);
               setChats(response.data);
            }
         })
      }else {
         setState('login');
      }
      socket.off('chat');
      socket.on('chat', (data: { user: string, message: string }) => {
         setChats(prevChats => [...(prevChats || []), data]);

         console.log('New message received:', data);
      });

      socket.emit('join', { user: userData.user });
      socket.off('user-join'); // Remove any previous listeners to avoid duplicates
      socket.on('user-joined', (data: { user: string }) => {
         console.log(`${data.user} has joined the chat.`);
         setAlerts(prevAlerts => [...prevAlerts, `${data.user} has joined the chat.`]);
         if (alert.current) {
         alert.current!.className = 'alerts show';
         }

         interval.current = setTimeout(() => {
            if (alert.current) {
            alert.current!.className = 'alerts';
            alert.current!.innerHTML = '';
            }
         }, 3000);
      });

      socket.off('user-leave'); // Clear previous listeners to avoid duplicates
      socket.on('user-leave', (data: { user: string }) => {
         console.log(`${data.user} has left the chat.`);
         setAlerts(prevAlerts => [...prevAlerts, `${data.user} has left the chat.`]);
         if (alert.current) {
         alert.current!.className = 'alerts show';
         }

         interval.current = setTimeout(() => {
            if (alert.current) {
            alert.current!.className = 'alerts';
            alert.current!.innerHTML = '';
            }
         }, 3000);
      });

      socket.off('typing'); // Clear previous listeners to avoid duplicates
      socket.on('typing', (data: { user: string }) => {
         if (data.user !== userData.user) {
            setPlaceHolder(`${data.user} is typing...`);
            alert.current!.className = 'alerts show';
            alert.current!.innerHTML = `<div class="alert">${data.user} Typing...</div>`;
         }
      });
}, [setState, userData.user]);

   useEffect(() => {
   const timeout = setTimeout(() => {
      if (lastMessage.current) {
      lastMessage.current?.scrollIntoView({ behavior: 'smooth' });
      alert.current!.className = 'alerts';
      alert.current!.innerHTML = '';
      setPlaceHolder('Type a message...');
      }
   }, 50);
   return () => clearTimeout(timeout);
}, [chats]);

function handleLogout() {
   console.log(userData);
   axios.post(`${server}/logout`, {}, {
      headers: {
         "Content-Type": 'application/json',
         "Authorization": `Bearer ${localStorage.token}`
      }
   });

   socket.emit('leave', { user: userData.user });
   setState('login');
}

window.onbeforeunload = (e) => {
   socket.emit('leave', { user: userData.user });
   console.log(e);
   return 'Are you sure you want to leave?';
}
   function sendMessage(message: string) {
      if (!message) return;
      axios.post(`${server}/chat`, {
         message: message
      }, {
         headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${localStorage.token}`
         }
      }).catch((error) => {
         console.error('Error sending message:', error);
      });

      socket.emit('chat', { user: userData.user, message: message });
   }

   function handleInput(event: React.KeyboardEvent<HTMLInputElement>) {
      const message = event.currentTarget.value;
      if (event.key === 'Enter') {
         sendMessage(message.trim());
         event.currentTarget.value = ''; // Clear the input field after sending the message
      }

      socket.emit('typing', { user: userData.user });
   }

   function handleBlur() {
      setPlaceHolder('Type a message...');
      alert.current!.className = 'alerts';
      alert.current!.innerHTML = '';
   }
   

   return(
      <div className="chat-container">
         <div ref={alert} className="alerts">
            {alerts.map((alert, index) => (
               <div key={index} className="alert">
                  {alert}
               </div>
            ))}
         </div>

         <div className="header">
            <div className="user">
               <div className="user-icon">
                  <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <circle cx="50" cy="50" r="50" transform="matrix(-1 0 0 1 100 0)" fill="#D9D9D9" />
                     <path d="M22.0703 75.0391C26.3867 67.5391 34.4922 62.5 43.75 62.5H56.25C65.5078 62.5 73.6133 67.5391 77.9297 75.0391C71.0547 82.6953 61.0938 87.5 50 87.5C38.9062 87.5 28.9453 82.6758 22.0703 75.0391ZM100 50C100 36.7392 94.7322 24.0215 85.3553 14.6447C75.9785 5.26784 63.2608 0 50 0C36.7392 0 24.0215 5.26784 14.6447 14.6447C5.26784 24.0215 0 36.7392 0 50C0 63.2608 5.26784 75.9785 14.6447 85.3553C24.0215 94.7322 36.7392 100 50 100C63.2608 100 75.9785 94.7322 85.3553 85.3553C94.7322 75.9785 100 63.2608 100 50ZM50 53.125C46.2704 53.125 42.6935 51.6434 40.0563 49.0062C37.4191 46.369 35.9375 42.7921 35.9375 39.0625C35.9375 35.3329 37.4191 31.756 40.0563 29.1188C42.6935 26.4816 46.2704 25 50 25C53.7296 25 57.3065 26.4816 59.9437 29.1188C62.5809 31.756 64.0625 35.3329 64.0625 39.0625C64.0625 42.7921 62.5809 46.369 59.9437 49.0062C57.3065 51.6434 53.7296 53.125 50 53.125Z"  className='color' fill="black" />
                  </svg>

               </div>
               <div className="user-info">
                  <div className="name" translate='no'>{userData.name}</div>
                  <div className="user" translate='no'>{userData.user}</div>
               </div>
                  <div className="logout" onClick={handleLogout}>Logout</div>
            </div>
            </div>
            <div ref={chat} className="chat">
               { 
                  chats?.length ? chats.map((message, index) => <div ref={lastMessage} key={index} className={`message ${message.user === userData.user ? 'self' : 'other'}`}>
                     <div className="user">
                        <div className="user-icon">
                           <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="50" cy="50" r="50" transform="matrix(-1 0 0 1 100 0)" fill="#D9D9D9" />
                              <path d="M22.0703 75.0391C26.3867 67.5391 34.4922 62.5 43.75 62.5H56.25C65.5078 62.5 73.6133 67.5391 77.9297 75.0391C71.0547 82.6953 61.0938 87.5 50 87.5C38.9062 87.5 28.9453 82.6758 22.0703 75.0391ZM100 50C100 36.7392 94.7322 24.0215 85.3553 14.6447C75.9785 5.26784 63.2608 0 50 0C36.7392 0 24.0215 5.26784 14.6447 14.6447C5.26784 24.0215 0 36.7392 0 50C0 63.2608 5.26784 75.9785 14.6447 85.3553C24.0215 94.7322 36.7392 100 50 100C63.2608 100 75.9785 94.7322 85.3553 85.3553C94.7322 75.9785 100 63.2608 100 50ZM50 53.125C46.2704 53.125 42.6935 51.6434 40.0563 49.0062C37.4191 46.369 35.9375 42.7921 35.9375 39.0625C35.9375 35.3329 37.4191 31.756 40.0563 29.1188C42.6935 26.4816 46.2704 25 50 25C53.7296 25 57.3065 26.4816 59.9437 29.1188C62.5809 31.756 64.0625 35.3329 64.0625 39.0625C64.0625 42.7921 62.5809 46.369 59.9437 49.0062C57.3065 51.6434 53.7296 53.125 50 53.125Z" className='color' fill="black" />
                           </svg>
                        </div>
                           <div className="user" translate='no'>{message.user}</div>
                     </div>
                     <div className="text" translate='no'>{message.message}</div>
                  </div>): 'No Messages Yet'
               }
            </div>
            <div className="typing">
               <input ref={input} onBlur={handleBlur} onKeyDown={handleInput} type="text" placeholder={placeHolder}/>
            </div>
      </div>
   );
}