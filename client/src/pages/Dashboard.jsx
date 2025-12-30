import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, Paperclip, MoreVertical, LogOut, Shield, Lock } from 'lucide-react';
import socket from '../lib/socket';
import { generateKeyPair, exportKey, importPublicKey, encryptMessage, decryptMessage } from '../lib/crypto';
import NeonButton from '../components/UI/NeonButton';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]); // { from, to, text, timestamp }
    const [privateKey, setPrivateKey] = useState(null);
    const [encryptionReady, setEncryptionReady] = useState(false);
    const messagesEndRef = useRef(null);

    // State for Tabs and Lists
    const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'add', 'requests'
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);

    // 1. Initialization: Load User, Generate Keys, Connect Socket
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFriendRequests(parsedUser.requests || []);

        // Auto-scroll logic
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };

        // Fetch latest user data (including requests/friends)
        const fetchUserData = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/auth/users');
                const allUsers = await res.json();
                const currentUser = allUsers.find(u => u.id === parsedUser.id);

                if (currentUser) {
                    setFriendRequests(currentUser.requests || []);
                    // Filter full user objects for friends
                    const friendIds = currentUser.friends || [];
                    const friendsList = allUsers.filter(u => friendIds.includes(u.id));
                    setFriends(friendsList);

                    // Update local storage
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            } catch (e) { console.error(e); }
        };

        const initCrypto = async () => {
            console.log("Generating Keys...");
            const keyPair = await generateKeyPair();
            setPrivateKey(keyPair.privateKey);
            const publicKeyBase64 = await exportKey(keyPair.publicKey);

            // Connect Socket
            socket.auth = { userId: parsedUser.id };
            socket.connect();
            socket.emit('register_user', parsedUser.id);
            socket.emit('store_public_key', { userId: parsedUser.id, publicKey: publicKeyBase64 });

            setEncryptionReady(true);
        };

        initCrypto();
        fetchUserData();

        // Listeners for Friend Requests
        socket.on('friend_request_received', (sender) => {
            setFriendRequests(prev => [...prev, sender]);
        });

        socket.on('request_accepted', ({ id, username }) => {
            alert(`${username} accepted your request!`);
            fetchUserData(); // Refresh friends list
        });

        socket.on('search_results', (results) => {
            // Filter out self and existing friends
            const filtered = results.filter(u => u.id !== parsedUser.id && !(parsedUser.friends || []).includes(u.id));
            setSearchResults(filtered);
        });

        return () => {
            socket.disconnect();
            socket.off('friend_request_received');
            socket.off('request_accepted');
            socket.off('search_results');
        };
    }, []);

    // 3. Socket Event Listeners (Chat)
    useEffect(() => {
        socket.on('receive_message', async (data) => {
            console.log("Received Encrypted Msg:", data);

            if (privateKey) {
                try {
                    const decryptedText = await decryptMessage(data.encryptedPackage, privateKey);
                    setMessages(prev => [...prev, {
                        ...data,
                        text: decryptedText
                    }]);
                } catch (err) {
                    console.error("Decryption fail", err);
                }
            } else {
                console.warn("Private Key not ready yet");
            }
        });

        return () => {
            socket.off('receive_message');
        };
    }, [privateKey]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // 4. Send Message Handler
    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedUser) return;

        // Check if recipient has a public key
        if (!selectedUser.publicKey) {
            if (!selectedUser.publicKey) {
                alert("This user hasn't come online yet to establish a secure key.");
                return;
            }
        }

        try {
            const recipientKey = await importPublicKey(selectedUser.publicKey);
            const encryptedPackage = await encryptMessage(message, recipientKey);

            const msgData = {
                from: user.id,
                to: selectedUser.id,
                encryptedPackage,
                timestamp: new Date().toISOString()
            };

            socket.emit('send_message', msgData);

            setMessages(prev => [...prev, {
                ...msgData,
                text: message
            }]);
            setMessage('');

        } catch (err) {
            console.error("Encryption failed before sending", err);
            alert("Encryption Error");
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value.length > 1) {
            socket.emit('search_users', e.target.value);
        } else {
            setSearchResults([]);
        }
    };

    const sendRequest = (targetId) => {
        socket.emit('send_friend_request', { from: user.id, to: targetId });
        alert("Request Sent!");
    };

    const acceptRequest = (requesterId) => {
        socket.emit('accept_friend_request', { userId: user.id, requesterId });
        setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
    };

    const rejectRequest = (requesterId) => {
        socket.emit('reject_friend_request', { userId: user.id, requesterId });
        setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
    };

    return (
        <div className="dashboard-container">
            <style>{`
                .dashboard-container {
                    display: flex;
                    height: calc(100vh - 85px);
                    background: var(--color-bg-dark);
                    overflow: hidden;
                    position: relative;
                }
                .sidebar {
                    width: 320px;
                    border-right: 1px solid var(--glass-border);
                    display: flex;
                    flex-direction: column;
                    background: rgba(17, 24, 39, 0.4);
                }
                .chat-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: radial-gradient(circle at 50% 50%, #1a1033 0%, var(--color-bg-dark) 80%);
                    position: relative;
                }
                .tab-header {
                    display: flex;
                    border-bottom: 1px solid var(--glass-border);
                }
                .tab-btn {
                    flex: 1;
                    padding: 1rem;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 600;
                    border-bottom: 2px solid transparent;
                }
                .tab-btn.active {
                    color: var(--color-primary);
                    border-bottom: 2px solid var(--color-primary);
                    background: rgba(155, 92, 255, 0.05);
                }
                .user-item {
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .user-item:hover {
                    background: rgba(255,255,255,0.05);
                }
                .user-item.active {
                    background: rgba(155, 92, 255, 0.1);
                    border-left: 3px solid var(--color-primary);
                }
                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-size: cover;
                    border: 2px solid var(--color-primary);
                }
            `}</style>

            {/* Sidebar */}
            <div className="sidebar">
                {/* User Profile Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar" style={{ backgroundImage: `url(${user?.avatar})` }}></div>
                    <div>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>{user?.username}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tab-header">
                    <button className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
                        Friends {friends.length > 0 && `(${friends.length})`}
                    </button>
                    <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                        Requests {friendRequests.length > 0 && <span style={{ color: 'var(--color-accent)' }}>({friendRequests.length})</span>}
                    </button>
                    <button className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
                        Add
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto' }}>

                    {/* FRIENDS TAB */}
                    {activeTab === 'friends' && (
                        <>
                            {friends.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No friends yet. <br /> Go to "Add" to find people!
                                </div>
                            ) : (
                                friends.map(u => (
                                    <div
                                        key={u.id}
                                        className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                                        onClick={() => setSelectedUser(u)}
                                    >
                                        <div className="avatar" style={{ backgroundImage: `url(${u.avatar})` }}></div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{u.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tap to chat</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {/* REQUESTS TAB */}
                    {activeTab === 'requests' && (
                        <>
                            {friendRequests.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No pending requests.
                                </div>
                            ) : (
                                friendRequests.map(req => (
                                    <div key={req.id} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <div className="avatar" style={{ backgroundImage: `url(${req.avatar})` }}></div>
                                            <span style={{ fontWeight: 600 }}>{req.username}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <NeonButton onClick={() => acceptRequest(req.id)} style={{ fontSize: '0.8rem', padding: '5px 10px' }}>Accept</NeonButton>
                                            <button onClick={() => rejectRequest(req.id)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', padding: '5px 10px' }}>Decline</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {/* ADD TAB */}
                    {activeTab === 'add' && (
                        <div style={{ padding: '1rem' }}>
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search Username..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {searchResults.map(u => (
                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="avatar" style={{ backgroundImage: `url(${u.avatar})` }}></div>
                                        <span>{u.username}</span>
                                    </div>
                                    <button onClick={() => sendRequest(u.id)} style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="chat-area">
                {selectedUser ? (
                    <>
                        <div style={{
                            padding: '1rem 2rem',
                            background: 'rgba(11, 15, 26, 0.8)',
                            backdropFilter: 'blur(10px)',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="avatar" style={{ backgroundImage: `url(${selectedUser.avatar})` }}></div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{selectedUser.username}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Lock size={12} /> End-to-End Encrypted
                                    </span>
                                </div>
                            </div>
                            <MoreVertical size={20} color="var(--text-muted)" />
                        </div>

                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ textAlign: 'center', margin: '1rem 0', opacity: 0.7 }}>
                                <span style={{
                                    background: 'rgba(155, 92, 255, 0.1)',
                                    color: 'var(--color-primary)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    border: '1px solid rgba(155, 92, 255, 0.3)'
                                }}>
                                    🔒 Messages are secured with AES-256 + RSA encryption
                                </span>
                            </div>

                            {messages
                                .filter(m => (m.from === user.id && m.to === selectedUser.id) || (m.from === selectedUser.id && m.to === user.id))
                                .map((msg, idx) => {
                                    const isMe = msg.from === user.id;
                                    return (
                                        <div key={idx} style={{
                                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%'
                                        }}>
                                            <div style={{
                                                background: isMe ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                                color: 'white',
                                                padding: '12px 18px',
                                                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                boxShadow: isMe ? '0 4px 15px rgba(155,92,255,0.3)' : 'none',
                                                border: isMe ? 'none' : '1px solid var(--glass-border)'
                                            }}>
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && <span style={{ marginLeft: '4px' }}>✓✓</span>}
                                            </div>
                                        </div>
                                    );
                                })
                            }
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: '1.5rem', background: 'rgba(11, 15, 26, 0.9)', borderTop: '1px solid var(--glass-border)' }}>
                            <form
                                onSubmit={handleSend}
                                style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'border-color 0.3s'
                                }}
                            >
                                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a secure message..."
                                    style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '1rem' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim()}
                                    style={{
                                        background: message.trim() ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '8px',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: message.trim() ? 'pointer' : 'default',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
                        <Shield size={64} style={{ marginBottom: '1rem', color: 'var(--glass-border)' }} />
                        <h2>Select a friend from the sidebar to chat</h2>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '10px' }}>Go to "Add" tab to find new friends!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
