import { useState } from 'react';  
import Login from './Login';
import Chat from './Chat';

function App() {
  type State = 'login' | 'chat';
  type UserData = {
    name: string;
    user: string;
    password: string;
  }
  const [ state, setState ] = useState<State>('login')
  const [ userData, setUserData ] = useState<UserData>({
    name: '',
    user: '',
    password: ''
  });

  return (
    <>
    <div className={`app ${state}`}>
        {state === 'login' ? (<Login vars={{ state, setState, userData, setUserData }} />)
          : (<Chat vars={{ state, setState, userData, setUserData }} />)
        }
    </div>
    </>
  )
}

export default App
