import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

type Props = {
  tipo: 'sucesso' | 'erro' | 'aviso';
  mensagem?: string | null;
  onFechar?: () => void;
  duracao?: number; // em ms; some sozinho se onFechar for informado
};

export default function Feedback({ tipo, mensagem, onFechar, duracao = 4000 }: Props) {
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];
  const fundo = {
    sucesso: cores.sucesso,
    erro: cores.erro,
    aviso: cores.aviso,
  };
  const onFecharRef = useRef(onFechar);

  useEffect(() => {
    onFecharRef.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    if (!mensagem || !onFecharRef.current) return;
    const timer = setTimeout(() => onFecharRef.current?.(), duracao);
    return () => clearTimeout(timer);
  }, [mensagem, duracao]);

  if (!mensagem) return null;

  return (
    <Pressable
      onPress={onFechar}
      style={[estilos.caixa, { backgroundColor: fundo[tipo] }]}
    >
      <Text style={[estilos.texto, { color: cores.textoSobreStatus }]}>{mensagem}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  texto: { fontSize: 14, fontWeight: '600' },
});