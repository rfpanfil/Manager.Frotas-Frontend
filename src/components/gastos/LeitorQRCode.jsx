import { useEffect } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";

export default function LeitorQRCode({ onScanSuccess, onClose }) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Ignora erros de leitura contínua
            }
        );

        return () => {
            try { scanner.clear(); } catch (e) { /* ignore */ }
        };
    }, [onScanSuccess]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 2000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ background: 'white', padding: '10px', borderRadius: '10px', width: '90%', maxWidth: '400px' }}>
                <div id="reader" style={{ width: '100%' }}></div>
            </div>
            <button
                onClick={onClose}
                style={{ marginTop: '20px', padding: '10px 30px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem' }}
            >
                Cancelar / Fechar Câmera
            </button>
        </div>
    );
}
