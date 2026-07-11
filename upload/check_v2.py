import struct
import sys
import os

def check_v2_signature(apk_path):
    with open(apk_path, 'rb') as f:
        f.seek(0, 2)
        size = f.tell()
        if size < 22:
            print("Fichier trop petit")
            return
        
        # Chercher le End of Central Directory Record (EOCD)
        # La taille minimale est 22, mais il peut y avoir un commentaire (max 65535 bytes)
        # On lit les 65535 derniers octets
        read_size = min(size, 65535 + 22)
        f.seek(-read_size, 2)
        data = f.read(read_size)
        
        eocd_offset = -1
        for i in range(read_size - 22, -1, -1):
            if data[i:i+4] == b'\x50\x4b\x05\x06':
                eocd_offset = i
                break
                
        if eocd_offset == -1:
            print("EOCD non trouvé")
            return
            
        eocd_record = data[eocd_offset:eocd_offset+22]
        cd_offset = struct.unpack('<I', eocd_record[16:20])[0]
        
        # Le APK Signing Block V2 se trouve juste avant le Central Directory
        # Chercher le magic "APK Sig Block 42" (16 bytes)
        f.seek(cd_offset - 24)
        magic_and_size = f.read(24)
        size_of_block, magic = struct.unpack('<Q16s', magic_and_size)
        
        if magic == b'APK Sig Block 42':
            print("✅ L'APK contient une signature V2/V3 !")
        else:
            print("❌ L'APK NE CONTIENT PAS de signature V2/V3. Il est uniquement signé en V1.")
            print(f"Magic trouvé : {magic}")

if __name__ == '__main__':
    check_v2_signature(r"E:\bestmode\output\PDF_diamond.apk")
