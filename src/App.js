import './App.css';
import SocketClient from './SocketClient';
import {useEffect, useState} from "react";
import {Duration} from 'luxon';

function App() {
    const [apiKey, setApiKey] = useState(SocketClient.getApiKey());
    const [standings, setStandings] = useState([]);
    const [showApiKey, setShowApiKey] = useState(false);

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
                    // Update the standings array
                    const updatedStandings = [...prevStandings.filter((obj) => obj.id !== message.id), { ...message }];

                    // Sort the updated standings
                    const sortedStandings = updatedStandings.sort((a, b) => {
                        if (a.laps !== b.laps) {
                            return b.laps - a.laps; // Sort by laps (descending)
                        }
                        return a.elapsed - b.elapsed; // Sort by elapsed time (ascending)
                    });

                    // Calculate positions based on the sorted standings
                    let lastPosition = 0;
                    let lastLaps = -1;
                    let lastElapsed = -1;
                    return sortedStandings.map((standing, index) => {
                        let position = index + 1;

                        if (standing.laps === lastLaps && standing.elapsed === lastElapsed) {
                            position = lastPosition;
                        } else {
                            lastPosition = position;
                            lastLaps = standing.laps;
                            lastElapsed = standing.elapsed;
                        }

                        return {
                            ...standing,
                            position
                        };
                    });
                });
            }
        };
        SocketClient.socket.on("host_event", processEvent);
        return () => {
            SocketClient.socket.off('host_event', processEvent);
        }
    }, [standings]);

    const toggleApiKeyVisibility = () => {
        setShowApiKey(!showApiKey);
    };

    return (
        <div className="app">
            <h1>Neon Timing Socket.io Example</h1>

            <h2>Connection Settings</h2>
            <div>
                <label>API Key</label><br/>
                <input type={showApiKey ? 'text' : 'password'}
                       name="token"
                       onChange={e => {
                    setApiKey(e.target.value);
                    SocketClient.setApiKey(e.target.value);
                }} value={apiKey} style={{width: '16rem'}}/>
                <button onClick={toggleApiKeyVisibility}>
                    {showApiKey ? 'Hide' : 'Show'} API Key
                </button>
            </div>

            <h2>Live Results</h2>
            <table>
                <thead>
                <tr>
                    <th>Position</th>
                    <th>Name</th>
                    <th>Laps</th>
                    <th>Elapsed Time</th>
                    <th>Fast Lap</th>
                    <th>Status</th>
                    <th>Transponder</th>
                </tr>
                </thead>
                {standings.map(standing => {
                    return <tr key={standing.id}>
                        <td>{standing.position}</td>
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
