import { useState } from "react";
import { Modal, View, TextInput, Button, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "../lib/trpc-native";
import supabase from "../lib/supabase-native";

export default function CreatePostModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [imgUri, setImgUri] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const create = trpc.posts.create.useMutation({
    onSuccess: () => {
      utils.posts.getInfiniteFeed.invalidate();
      onClose();
      setContent(""); 
      setImgUri(null);
    },
  });

  const pickImg = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) setImgUri(res.assets[0].uri);
  };

  const handleSubmit = async () => {
    let imageUrl: string | undefined;
    if (imgUri) {
      const file = await fetch(imgUri).then(r => r.blob());
      const name = `posts/${Date.now()}.jpg`;
      await supabase.storage.from("post-images").upload(name, file, { upsert: true });
      imageUrl = supabase.storage.from("post-images").getPublicUrl(name).data.publicUrl;
    }
    create.mutate({ content, imageUrl });
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <TextInput
          placeholder="What's on your mind?"
          multiline
          style={styles.input}
          value={content}
          onChangeText={setContent}
        />
        {imgUri && <Image source={{ uri: imgUri }} style={styles.preview} />}
        <View style={styles.buttonGroup}>
          <Button title="Pick Image" onPress={pickImg} />
          <Button 
            title="Post" 
            onPress={handleSubmit} 
            disabled={create.isLoading || !content.trim()} 
          />
          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
  },
  preview: {
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  buttonGroup: {
    gap: 12,
  },
}); 