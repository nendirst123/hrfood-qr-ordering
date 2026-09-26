import subprocess
import os

scratch_dir = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering"
video_raw = os.path.join(scratch_dir, "video_output/raw_cinematic.mp4")
voiceover = os.path.join(scratch_dir, "voiceover.mp3")
sfx_beep = os.path.join(scratch_dir, "video_output/beep.wav")
sfx_bell = os.path.join(scratch_dir, "video_output/bell.wav")

final_out_1 = "/run/media/zabirru/BEBAS SIH/2026/PROJECT HR FOOD/HR_FOOD_Coming_Soon_Cinematic_VeoStyle.mp4"
final_out_2 = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/HR_FOOD_Coming_Soon_Cinematic_VeoStyle.mp4"

final_cmd = [
    "ffmpeg", "-y",
    "-i", video_raw,
    "-i", voiceover,
    "-i", sfx_beep,
    "-i", sfx_bell,
    "-filter_complex",
    "[1:a]volume=1.1,apad=pad_dur=2[vocal];"
    "[2:a]adelay=6200|6200,volume=0.45[beep];"
    "[3:a]adelay=16500|16500,volume=0.55[bell];"
    "[vocal][beep][bell]amix=inputs=3:duration=first:dropout_transition=1[aout]",
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "19",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    final_out_2
]

print("Muxing final cinematic video...")
subprocess.run(final_cmd, check=True)
subprocess.run(["cp", final_out_2, final_out_1], check=True)
print("Successfully generated HR_FOOD_Coming_Soon_Cinematic_VeoStyle.mp4!")
