import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Botao from './Botao';
import Input from './Input';
import Feedback from './Feedback';
import { rotuloMotivo } from './CardMovimentacao';
import { cores } from '../constants/cores';
import { useAuthStore } from '../store/useAuthStore';
import { useProdutosStore } from '../store/useProdutosStore';
import { registrarMovimentacao } from '../services/movimentacoesService';
import { MOTIVOS_ENTRADA, MOTIVOS_SAIDA, TipoMovimentacao } from '../types';

type Props = {
  visible: boolean;
  onFechar: () => void;
  onSalvo: () => void; // avisa a tela para recarregar o histórico
};

export default function FormMovimentacao({ visible, onFechar, onSalvo }: Props) {
  const user = useAuthStore((s) => s.user);
  const produtos = useProdutosStore((s) => s.produtos);
  const carregarProdutos = useProdutosStore((s) => s.carregar);

  // Valores dos campos
  const [produtoId, setProdutoId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoMovimentacao>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState(new Date());
  const [mostrarData, setMostrarData] = useState(false);

  // Mensagens de erro de cada campo
  const [erroProduto, setErroProduto] = useState('');
  const [erroQuantidade, setErroQuantidade] = useState('');
  const [erroMotivo, setErroMotivo] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState('');

  // Limpa o formulário toda vez que ele abre
  useEffect(() => {
    if (visible) {
      setProdutoId(null);
      setTipo('entrada');
      setQuantidade('');
      setMotivo('');
      setData(new Date());
      setMostrarData(false);
      setErroProduto('');
      setErroQuantidade('');
      setErroMotivo('');
      setErroGeral('');
    }
  }, [visible]);

  // Os motivos mudam conforme o tipo
  const motivos: readonly string[] =
    tipo === 'entrada' ? MOTIVOS_ENTRADA : MOTIVOS_SAIDA;

  function trocarTipo(novoTipo: TipoMovimentacao) {
    setTipo(novoTipo);
    setMotivo(''); // o motivo escolhido pode não existir no outro tipo
    setErroMotivo('');
  }

  // Monta o timestamp (ms) que será salvo
  function calcularData(): number {
    // No navegador não há seletor: usa a data/hora atual
    if (Platform.OS === 'web') return Date.now();
    // No celular: usa o dia escolhido com a hora atual
    const agora = new Date();
    const escolhida = new Date(data);
    escolhida.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds());
    return escolhida.getTime();
  }

  async function salvar() {
    if (!user) return;

    // Validação de cada campo
    let valido = true;
    setErroProduto('');
    setErroQuantidade('');
    setErroMotivo('');
    setErroGeral('');

    if (!produtoId) {
      setErroProduto('Selecione um produto.');
      valido = false;
    }

    const textoQtd = quantidade.trim();
    const qtd = Number(textoQtd);
    if (!/^\d+$/.test(textoQtd) || qtd <= 0) {
      setErroQuantidade('Informe um número inteiro maior que zero.');
      valido = false;
    }

    if (!motivo) {
      setErroMotivo('Selecione um motivo.');
      valido = false;
    }

    if (!valido || !produtoId) return;

    setSalvando(true);
    try {
      await registrarMovimentacao(user.uid, {
        produtoId,
        tipo,
        quantidade: qtd,
        motivo,
        data: calcularData(),
      });
      onFechar(); // fecha o modal
      carregarProdutos(user.uid); // atualiza as quantidades dos produtos
      onSalvo(); // avisa a tela para recarregar o histórico
    } catch (e) {
      const mensagem = (e as Error).message;
      if (mensagem.startsWith('Estoque insuficiente')) {
        setErroQuantidade(mensagem); // aparece embaixo do campo quantidade
      } else {
        setErroGeral(mensagem);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.fundo}>
        <View style={styles.caixa}>
          <ScrollView contentContainerStyle={styles.conteudo}>
            <Text style={styles.titulo}>Nova movimentação</Text>

            {erroGeral !== '' && (
              <Feedback tipo="erro" mensagem={erroGeral} onFechar={() => setErroGeral('')} />
            )}

            {/* Produto */}
            <Text style={styles.rotulo}>Produto</Text>
            {produtos.length === 0 ? (
              <Text style={styles.aviso}>Nenhum produto cadastrado.</Text>
            ) : (
              produtos.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setProdutoId(p.id);
                    setErroProduto('');
                  }}
                  style={[styles.opcao, produtoId === p.id && styles.opcaoAtiva]}
                >
                  <Text style={[styles.opcaoTexto, produtoId === p.id && styles.opcaoTextoAtivo]}>
                    {p.nome} (estoque: {p.quantidade})
                  </Text>
                </Pressable>
              ))
            )}
            {erroProduto !== '' && <Text style={styles.erro}>{erroProduto}</Text>}

            {/* Tipo */}
            <Text style={styles.rotulo}>Tipo</Text>
            <View style={styles.linha}>
              <View style={styles.metade}>
                <Botao
                  titulo="Entrada"
                  onPress={() => trocarTipo('entrada')}
                  variante={tipo === 'entrada' ? 'primario' : 'secundario'}
                />
              </View>
              <View style={styles.metade}>
                <Botao
                  titulo="Saída"
                  onPress={() => trocarTipo('saida')}
                  variante={tipo === 'saida' ? 'primario' : 'secundario'}
                />
              </View>
            </View>

            {/* Quantidade */}
            <Input
              label="Quantidade"
              value={quantidade}
              onChangeText={(t) => {
                setQuantidade(t);
                setErroQuantidade('');
              }}
              keyboardType="numeric"
              placeholder="Ex.: 5"
              erro={erroQuantidade}
            />

            {/* Motivo */}
            <Text style={styles.rotulo}>Motivo</Text>
            <View style={styles.chips}>
              {motivos.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMotivo(m);
                    setErroMotivo('');
                  }}
                  style={[styles.chip, motivo === m && styles.opcaoAtiva]}
                >
                  <Text style={[styles.opcaoTexto, motivo === m && styles.opcaoTextoAtivo]}>
                    {rotuloMotivo(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
            {erroMotivo !== '' && <Text style={styles.erro}>{erroMotivo}</Text>}

            {/* Data: só no celular */}
            {Platform.OS !== 'web' && (
              <View>
                <Text style={styles.rotulo}>Data</Text>
                <Botao
                  titulo={data.toLocaleDateString('pt-BR')}
                  onPress={() => setMostrarData(true)}
                  variante="secundario"
                />
                {mostrarData && (
                  <DateTimePicker
                    value={data}
                    mode="date"
                    maximumDate={new Date()}
                    onChange={(_evento, dataEscolhida) => {
                      // No Android o seletor fecha sozinho; no iOS fica aberto
                      setMostrarData(Platform.OS === 'ios');
                      if (dataEscolhida) setData(dataEscolhida);
                    }}
                  />
                )}
              </View>
            )}
            {Platform.OS === 'web' && (
              <Text style={styles.aviso}>A data e a hora atuais serão usadas.</Text>
            )}

            {/* Botões */}
            <View style={styles.acoes}>
              <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
              <Botao
                titulo="Cancelar"
                onPress={onFechar}
                variante="secundario"
                desabilitado={salvando}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  caixa: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: cores.fundo,
    borderRadius: 16,
  },
  conteudo: { padding: 20, gap: 8 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: cores.texto, marginBottom: 8 },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto, marginTop: 8 },
  linha: { flexDirection: 'row', gap: 8 },
  metade: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  opcao: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  opcaoAtiva: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  opcaoTexto: { color: cores.texto },
  opcaoTextoAtivo: { color: '#fff', fontWeight: '600' },
  erro: { color: cores.erro, fontSize: 13 },
  aviso: { color: cores.texto, opacity: 0.6, fontSize: 13 },
  acoes: { marginTop: 16, gap: 8 },
});