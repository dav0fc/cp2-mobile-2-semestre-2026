import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type AvatarProps = {
  photoUrl: string;
  name: string;
  size?: number;
};

// Mostra a foto quando existe e carrega; caso contrario (ou se falhar o
// load) cai no circulo com a inicial do nome
export default function Avatar({ photoUrl, name, size = 48 }: AvatarProps) {
  const [erroImg, setErroImg] = useState(false);

  // Se a foto mudar (ex: usuario trocou a foto), tenta de novo
  useEffect(() => {
    setErroImg(false);
  }, [photoUrl]);

  const mostrarImg = photoUrl !== '' && !erroImg;
  const inicial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {mostrarImg ? (
        <Image
          source={{ uri: photoUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setErroImg(true)}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.inicial, { fontSize: size * 0.4 }]}>{inicial}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0F2F1',
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
