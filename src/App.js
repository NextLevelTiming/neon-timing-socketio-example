import './App.css';
import SocketClient from './SocketClient';
import {useState} from "react";

function App() {

    const [transponder, setTransponder] = useState('123');
    const [apiKey, setApiKey] = useState(SocketClient.getApiKey());

    return (
        <div className="app">
            <h1>Neon Timing Socket.io Example</h1>

            <h2>Connection Settings</h2>
            <div>
                <label>API Key</label><br/>
                <input type="text" name="token" onChange={e => {
                    setApiKey(e.target.value);
                    SocketClient.setApiKey(e.target.value);
                }} value={apiKey} style={{width: '16rem'}}/>
            </div>

            <h2>Transponder Passed Gate Test</h2>
            <p><button onClick={() => SocketClient.newGateEvent(transponder)}>New Lap</button></p>
            <div>
                <p>
                    <label>Transponder</label><br/>
                    <input name="timeout" onChange={e => setTransponder(e.target.value)} value={transponder}/>
                </p>
            </div>
        </div>
    );
}

export default App;
