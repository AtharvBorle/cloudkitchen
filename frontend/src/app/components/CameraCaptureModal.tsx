"use client";

import React, { useRef, useState, useEffect } from 'react';
import { X, RefreshCcw, Camera } from 'lucide-react';

interface CameraCaptureModalProps {
    onCapture: (file: File) => void;
    onClose: () => void;
    skipWatermark?: boolean;
}

export default function CameraCaptureModal({ onCapture, onClose, skipWatermark = false }: CameraCaptureModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [isSecureContext, setIsSecureContext] = useState(true);
    const [locationText, setLocationText] = useState<string>(skipWatermark ? "" : "Locating GPS...");

    const fallbackIPLocation = async () => {
        try {
            setLocationText("Locating via IP...");
            const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    const lat = Number(data.latitude).toFixed(6);
                    const lng = Number(data.longitude).toFixed(6);
                    setLocationText(`LAT: ${lat}, LNG: ${lng} (approx)`);
                    return;
                }
            }
        } catch (e) {
            console.error("IP geolocation fallback failed:", e);
        }
        setLocationText("Location: Unavailable");
    };

    const triggerGPSRetrieval = () => {
        setLocationText("Locating GPS...");
        if (navigator.geolocation) {
            const retrieveLocation = (highAccuracy: boolean) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude.toFixed(6);
                        const lng = position.coords.longitude.toFixed(6);
                        setLocationText(`LAT: ${lat}, LNG: ${lng}`);
                    },
                    (error) => {
                        console.error(`Error getting geolocation (highAccuracy=${highAccuracy}):`, error);
                        if (highAccuracy) {
                            // Fallback to low accuracy
                            retrieveLocation(false);
                        } else {
                            if (error.code === error.PERMISSION_DENIED) {
                                setLocationText("Location: Permission Denied");
                            } else {
                                // Timeout or unavailable — try IP-based fallback
                                fallbackIPLocation();
                            }
                        }
                    },
                    highAccuracy 
                        ? { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 }
                        : { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
                );
            };
            retrieveLocation(true);
        } else {
            fallbackIPLocation();
        }
    };

    useEffect(() => {
        if (!skipWatermark) {
            triggerGPSRetrieval();
        }
    }, [skipWatermark]);

    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setIsSecureContext(false);
            return;
        }

        let currentStream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode }
                });
                currentStream = mediaStream;
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Could not access camera. Please ensure you have given camera permissions.");
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    const isLocating = !skipWatermark && locationText.startsWith("Locating");

    const handleCapture = () => {
        if (isLocating) {
            alert("Please wait for location detection to complete before capturing.");
            return;
        }
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            if (context) {
                // Draw the video frame
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                if (!skipWatermark) {
                    // Add watermark/location info overlay on the image itself
                    const padding = 15;
                    const fontSize = Math.max(14, Math.floor(canvas.width / 32));
                    context.font = `bold ${fontSize}px sans-serif`;
                    
                    const timestamp = new Date().toLocaleString();
                    const watermarkLines = [
                        "LIVE VERIFICATION PHOTO",
                        locationText,
                        timestamp
                    ];
                    
                    // Calculate height and width for the background bar
                    const lineHeight = fontSize + 8;
                    const barHeight = watermarkLines.length * lineHeight + padding * 2;
                    
                    // Draw semi-transparent dark background band at the bottom
                    context.fillStyle = "rgba(0, 0, 0, 0.65)";
                    context.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
                    
                    // Draw white text lines
                    context.fillStyle = "#ffffff";
                    watermarkLines.forEach((line, index) => {
                        context.fillText(
                            line, 
                            padding, 
                            canvas.height - barHeight + padding + (index * lineHeight) + fontSize
                        );
                    });
                }
            }
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleConfirm = () => {
        if (capturedImage && canvasRef.current) {
            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    onClose();
                }
            }, 'image/jpeg');
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    if (!isSecureContext) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X color="#333" size={24} />
                    </button>
                    <Camera size={50} color="#94a3b8" style={{ marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px', color: '#1e293b' }}>Insecure Connection</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
                        Live camera access is restricted by your browser on non-HTTPS local IP connections.
                    </p>
                    <div style={{ position: 'relative', display: 'inline-block', width: '100%', overflow: 'hidden' }}>
                        <button className="btn btn-teal" type="button" style={{ width: '100%', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                            Choose Photo or Camera
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    onCapture(e.target.files[0]);
                                    onClose();
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X color="white" size={20} />
                </button>

                {!capturedImage ? (
                    <>                        <div style={{ position: 'relative' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto', minHeight: '300px', maxHeight: '75vh', objectFit: 'cover', display: 'block' }} />
                            {!skipWatermark && (
                                <div style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: isLocating 
                                        ? "rgba(217, 119, 6, 0.85)" 
                                        : (locationText.startsWith("Location:") ? "rgba(239, 68, 68, 0.85)" : "rgba(0, 0, 0, 0.65)"),
                                    color: "white",
                                    padding: "10px",
                                    fontSize: "0.85rem",
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    backdropFilter: "blur(4px)"
                                }}>
                                    {isLocating && (
                                        <span style={{
                                            width: "12px",
                                            height: "12px",
                                            border: "2px solid white",
                                            borderTopColor: "transparent",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite",
                                            display: "inline-block"
                                        }} />
                                    )}
                                    <span>{locationText}</span>
                                    {locationText.startsWith("Location:") && (
                                        <button 
                                            type="button" 
                                            onClick={triggerGPSRetrieval}
                                            style={{
                                                marginLeft: "10px",
                                                padding: "4px 10px",
                                                backgroundColor: "white",
                                                color: "#ef4444",
                                                border: "none",
                                                borderRadius: "4px",
                                                fontSize: "0.75rem",
                                                fontWeight: "bold",
                                                cursor: "pointer",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                                transition: "background-color 0.2s"
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                                        >
                                            Retry
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#111' }}>
                            <button title="Switch Camera" aria-label="Switch Camera" onClick={toggleCamera} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '10px' }}>
                                <RefreshCcw size={28} />
                            </button>
                            <button 
                                title="Capture" 
                                aria-label="Capture" 
                                onClick={handleCapture} 
                                style={{ 
                                    width: '70px', 
                                    height: '70px', 
                                    borderRadius: '50%', 
                                    backgroundColor: isLocating ? '#94a3b8' : 'white', 
                                    border: '5px solid #ccc', 
                                    cursor: isLocating ? 'not-allowed' : 'pointer', 
                                    outline: 'none', 
                                    boxShadow: '0 0 0 2px white',
                                    opacity: isLocating ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#475569',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {isLocating && "WAIT"}
                            </button>
                            <div style={{ width: '48px' }} /> {/* Spacer for centering */}
                        </div>
                    </>
                ) : (
                    <>
                        <img src={capturedImage} alt="Captured" style={{ width: '100%', height: 'auto', maxHeight: '75vh', objectFit: 'cover' }} />
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#111' }}>
                            <button onClick={handleRetake} style={{ padding: '12px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Retake</button>
                            <button onClick={handleConfirm} style={{ padding: '12px 24px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Use Photo</button>
                        </div>
                    </>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
