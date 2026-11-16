import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PALETAS_TEMA, useThemeStore } from '../store/useThemeStore';

const secoes = [
  {
    titulo: 'Finalidade',
    texto:
      'O Estok trata dados para autenticar usuários, administrar o acesso à conta e oferecer as funções de controle de estoque: cadastro e consulta de produtos, leitura de códigos de barras, registro de entradas e saídas e alertas de estoque baixo.',
  },
  {
    titulo: 'Dados utilizados',
    texto:
      'Podem ser tratados nome, e-mail, foto de perfil, nome da loja/unidade e informações de produtos e movimentações cadastrados. Senhas são gerenciadas pelo Firebase Authentication e não são armazenadas pelo Estok em texto legível.',
  },
  {
    titulo: 'Armazenamento e compartilhamento',
    texto:
      'Os dados da conta e do estoque são armazenados nos serviços Firebase Authentication e Cloud Firestore. Fotos podem ficar no Firebase Storage quando disponível ou somente no dispositivo. O Firebase, da Google, atua como fornecedor de infraestrutura; a localização e eventual transferência internacional dependem da configuração do projeto.',
  },
  {
    titulo: 'Segurança e retenção',
    texto:
      'O acesso ao estoque é associado à conta autenticada e às regras de acesso do Firebase. Mantenha suas credenciais em sigilo. Os dados são mantidos enquanto a conta e o uso do serviço estiverem ativos, observadas obrigações legais e operacionais; a exclusão da conta deve ser solicitada ao administrador responsável.',
  },
  {
    titulo: 'Direitos do titular',
    texto:
      'Nos termos da LGPD, você pode solicitar confirmação e acesso aos dados, correção, anonimização, bloqueio ou eliminação quando cabível, portabilidade, informações sobre compartilhamento e revisão de decisões automatizadas aplicáveis. Também pode apresentar reclamação à ANPD. Para exercer seus direitos, contate o administrador da loja/organização responsável pela sua conta, que deverá indicar o canal do controlador.',
  },
  {
    titulo: 'Atualizações deste aviso',
    texto:
      'Este aviso pode ser atualizado para refletir mudanças no app ou nas práticas de tratamento. Consulte esta página periodicamente e procure o administrador responsável caso tenha dúvidas sobre o tratamento dos seus dados.',
  },
];

export default function LgpdScreen() {
  const router = useRouter();
  const tema = useThemeStore((estado) => estado.tema);
  const cores = PALETAS_TEMA[tema];

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={[styles.cabecalho, { borderBottomColor: cores.borda }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.voltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={cores.primaria} />
        </Pressable>
        <Text style={[styles.tituloCabecalho, { color: cores.texto }]}>Privacidade e LGPD</Text>
        <View style={styles.voltar} />
      </View>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.introducao, { backgroundColor: cores.card, borderColor: cores.borda }]}>
          <Ionicons name="shield-checkmark-outline" size={28} color={cores.primaria} />
          <Text style={[styles.titulo, { color: cores.texto }]}>Aviso de privacidade</Text>
          <Text style={[styles.texto, { color: cores.textoSecundario }]}>
            Este aviso explica como o Estok trata informações pessoais e dados de estoque, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </Text>
        </View>

        {secoes.map((secao) => (
          <View
            key={secao.titulo}
            style={[styles.secao, { backgroundColor: cores.card, borderColor: cores.borda }]}
          >
            <Text style={[styles.tituloSecao, { color: cores.texto }]}>{secao.titulo}</Text>
            <Text style={[styles.texto, { color: cores.textoSecundario }]}>{secao.texto}</Text>
          </View>
        ))}
        <Text style={[styles.nota, { color: cores.textoSecundario }]}>
          Este aviso descreve as funções atualmente implementadas no Estok e não substitui a orientação jurídica do controlador dos dados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  cabecalho: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  voltar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tituloCabecalho: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  conteudo: { flexGrow: 1, padding: 16, paddingBottom: 32, gap: 12 },
  introducao: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 10 },
  titulo: { fontSize: 21, fontWeight: '800' },
  secao: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  tituloSecao: { fontSize: 16, fontWeight: '700' },
  texto: { fontSize: 14, lineHeight: 21 },
  nota: { fontSize: 12, lineHeight: 18, paddingHorizontal: 4 },
});
