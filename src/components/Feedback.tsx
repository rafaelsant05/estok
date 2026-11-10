import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { cores } from '../constants/cores';

type Props = {
  tipo: 'sucesso' | 'erro' | 'aviso';
  mensagem?: string | null;
  onFechar?: () => void;
  duracao?: number; // em ms; some sozinho se onFechar for informado
};

const fundo = {
  sucesso: cores.sucesso,
  erro: cores.erro,
  aviso: cores.aviso,
};

export default function Feedback({ tipo, mensagem, onFechar, duracao = 4000 }: Props) {
  useEffect(() => {
    if (!mensagem || !onFechar) return;
    const timer = setTimeout(onFechar, duracao);
    return () => clearTimeout(timer);
  }, [mensagem]);

  if (!mensagem) return null;

  return (
    <Pressable
      onPress={onFechar}
      style={[estilos.caixa, { backgroundColor: fundo[tipo] }]}
    >
      <Text style={estilos.texto}>{mensagem}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  texto: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});