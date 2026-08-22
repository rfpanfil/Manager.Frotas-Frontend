import React from 'react';

const CardDashboard = ({ titulo, valor, cor, statusFiltro, setModalListaStatus, setBuscaModalStatus }) => (
    <div onClick={() => { setModalListaStatus(statusFiltro); setBuscaModalStatus(''); }} style={{ background: '#2d3748', padding: 15, borderRadius: 8, flex: 1, borderLeft: `4px solid ${cor}`, cursor: 'pointer', transition: '0.2s' }}>
        <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{titulo}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{valor}</div>
    </div>
);

export default function CardsDashboardPneus({ resumo, setModalListaStatus, setBuscaModalStatus }) {
    return (
        <div style={{ display: 'flex', gap: 15, marginBottom: 25 }}>
            <CardDashboard titulo="Em Uso (Montados)" valor={resumo.em_uso} cor="#00d68f" statusFiltro="EM_USO" setModalListaStatus={setModalListaStatus} setBuscaModalStatus={setBuscaModalStatus} />
            <CardDashboard titulo="Em Estoque" valor={resumo.estoque} cor="#3182ce" statusFiltro="ESTOQUE" setModalListaStatus={setModalListaStatus} setBuscaModalStatus={setBuscaModalStatus} />
            <CardDashboard titulo="Em Manutenção" valor={resumo.manutencao} cor="#ecc94b" statusFiltro="MANUTENCAO" setModalListaStatus={setModalListaStatus} setBuscaModalStatus={setBuscaModalStatus} />
            <CardDashboard titulo="Sucata / Descartados" valor={resumo.sucata} cor="#e53e3e" statusFiltro="SUCATA" setModalListaStatus={setModalListaStatus} setBuscaModalStatus={setBuscaModalStatus} />
            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, flex: 1, borderLeft: `4px solid #805ad5` }}>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>CPK Médio</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>R$ {resumo.cpk_medio?.toFixed(2).replace('.', ',') || '0,00'}</div>
            </div>
        </div>
    );
}
