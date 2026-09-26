import asyncio
import edge_tts

text = (
    "Bosen antre panjang cuma buat pesan makan? "
    "Di HR Food, sekarang pesan makan gak pake ribet! "
    "Cukup duduk manis di meja, lalu scan barcode di atas meja kamu. "
    "Pilih lauk favorit, varian sambal, dan level pedas sesuka hati. "
    "Pesanan kamu langsung terkirim ke dapur, cepat, panas, dan siap santap! "
    "Coming soon, pengalaman baru di HR Food. Makan enak, mood naik!"
)

async def main():
    communicate = edge_tts.Communicate(text, voice="id-ID-ArdiNeural", rate="+6%", pitch="+1Hz")
    await communicate.save("/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/voiceover.mp3")
    print("Voiceover generated successfully!")

asyncio.run(main())
