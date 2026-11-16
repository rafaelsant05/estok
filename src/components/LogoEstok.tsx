import { Image, StyleSheet, View } from 'react-native';

type LogoEstokProps = {
  tamanho?: 'sm' | 'md' | 'lg';
};

const TAMANHOS = {
  sm: { width: 72, height: 24 },
  md: { width: 180, height: 60 },
  lg: { width: 240, height: 80 },
} as const;

export default function LogoEstok({ tamanho = 'md' }: LogoEstokProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo-estok.png')}
        resizeMode="contain"
        style={[styles.imagem, TAMANHOS[tamanho]]}
        accessibilityLabel="Estok"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignSelf: 'center', alignItems: 'center' },
  imagem: { backgroundColor: 'transparent' },
});
