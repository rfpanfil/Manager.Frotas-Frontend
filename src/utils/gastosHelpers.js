export function validarEPrepararGasto(form, anexosExistentes, arquivos, veiculos, linkQrProtegido) {
    // VALIDAÇÕES
    if (form.tipo_gasto === 'Combustível' && form.veiculo_id) {
        const veiculoSelecionado = veiculos.find(v => v.id == form.veiculo_id.value);
        const kmDigitado = parseFloat(form.km_registro);
        if (veiculoSelecionado && kmDigitado <= veiculoSelecionado.km_atual) {
            return { isValid: false, error: `ERRO DE ODÔMETRO!\nO KM informado (${kmDigitado}) é menor/igual ao KM atual do veículo.` };
        }
    }

    if (form.tipo_gasto === 'Combustível') {
        if (!form.veiculo_id) return { isValid: false, error: "Obrigatório selecionar Veículo." };
        if (!form.colaborador_id) return { isValid: false, error: "Obrigatório selecionar Solicitante." };
        if (!form.km_registro) return { isValid: false, error: "Obrigatório informar KM." };
        if (anexosExistentes.length === 0 && arquivos.length === 0) return { isValid: false, error: "FOTO DO ODÔMETRO OBRIGATÓRIA." };
    } else {
        const tiposFrota = ['Borracharia', 'Combustível', 'Estacionamento', 'Lava Car', 'Manutenção', 'Mão de obra', 'Multa', 'Pedágio', 'Revisão', 'Seguro veículos'];
        if (tiposFrota.includes(form.tipo_gasto)) {
            if (!form.veiculo_id) return { isValid: false, error: "Selecione veículo." };
        } else {
            if (!form.centro_custo_id) return { isValid: false, error: "Selecione Centro de Custo." };
        }
    }

    // PREPARAÇÃO DO FORMDATA
    const formData = new FormData();
    formData.append('data', form.data);
    formData.append('tipo_gasto', form.tipo_gasto);
    formData.append('valor', String(form.valor).replace(',', '.'));
    if (form.centro_custo_id) formData.append('centro_custo_id', form.centro_custo_id);

    let descricaoFinal = form.descricao || '';
    if (linkQrProtegido) descricaoFinal = `${linkQrProtegido} | ${descricaoFinal}`;
    if (descricaoFinal) formData.append('descricao', descricaoFinal);

    if (form.veiculo_id) formData.append('veiculo_id', form.veiculo_id.value);
    if (form.colaborador_id) formData.append('colaborador_id', form.colaborador_id.value);
    if (form.rota_id) formData.append('rota_id', form.rota_id);

    if (form.km_registro) {
        const kmLimpo = String(form.km_registro).replaceAll('.', '').replace(',', '.');
        formData.append('km_registro', kmLimpo);
    }

    if (form.tipo_gasto === 'Combustível' && form.combustivel) {
        formData.append('combustivel', form.combustivel);
        if (form.litros) formData.append('litros', String(form.litros).replace(',', '.'));
        if (form.preco_litro) formData.append('preco_litro', String(form.preco_litro).replace(',', '.'));
    }

    if (form.tipo_gasto === 'Manutenção') {
        if (form.tipo_manutencao) formData.append('tipo_manutencao', form.tipo_manutencao);
        if (form.status_manutencao) formData.append('status_manutencao', form.status_manutencao);
        if (form.dot) formData.append('dot', form.dot);
        if (form.proxima_troca_km) {
            const proxKmLimpo = String(form.proxima_troca_km).replaceAll('.', '').replace(',', '.');
            formData.append('proxima_troca_km', proxKmLimpo);
        }
    }

    if (arquivos && arquivos.length > 0) {
        for (let i = 0; i < arquivos.length; i++) formData.append('arquivos', arquivos[i]);
    }

    return { isValid: true, formData };
}
