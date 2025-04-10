import './App.css';
import SocketClient from './SocketClient';
import {useState, useEffect} from "react";
import {Duration} from 'luxon';

function App() {
    const [apiKey, setApiKey] = useState(SocketClient.getApiKey());
    const [standings, setStandings] = useState([]);

    useEffect(() => {
        //The socket is a module that exports the actual socket.io socket
        const processEvent = (message) => {
            if (message.cmd !== 'event'
                || message.evt !== 'race') {
                return;
            }
            if (message.type === 'race_staging') {
                setStandings([]);
            }
            if (message.type === 'standing') {
                setStandings(prevStandings => {
                    return [...prevStandings.filter((obj) => obj.id !== message.id), {...message}]
                });
            }
        };
        SocketClient.socket.on("host_event", processEvent);
        return () => {
            SocketClient.socket.off('host_event', processEvent);
        }
    }, [])

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

            <h2>Live Results</h2>
            <table>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Laps</th>
                    <th>Elapsed Time</th>
                    <th>Fast Lap</th>
                    <th>Status</th>
                    <th>Transponder</th>
                </tr>
                </thead>
                {standings.sort((a, b) => {
                    if (a.laps !== b.laps) {
                        return b.laps - a.laps;
                    }
                    if (a.elapsed !== b.elapsed) {
                        return a.elapsed - b.elapsed;
                    }
                    return 0;
                }).map(standing => {
                    return <tr key={standing.id}>
                        <td>{standing.name}</td>
                        <td>{standing.laps}</td>
                        <td>{standing.elapsed ? Duration.fromMillis(standing.elapsed).toFormat('m:ss.SSS') : '-'}</td>
                        <td>{standing.fast_lap ? Duration.fromMillis(standing.fast_lap).toFormat('m:ss.SSS') : '-'}</td>
                        <td>{standing.status}</td>
                        <td>{standing.transponder}</td>
                    </tr>
                })}
            </table>
        </div>
    );
}

export default App;
