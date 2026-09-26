import subprocess
import os

scratch_dir = "/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering"
video_raw = os.path.join(scratch_dir, "video_output/raw_video.mp4")
voiceover = os.path.join(scratch_dir, "voiceover.mp3")
final_out_1 = "/run/media/zabirru/BEBAS SIH/2026/PROJECT HR FOOD/HR_FOOD_Coming_Soon_Animation.mp4"
final_out_2 = "/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/HR_FOOD_Coming_Soon_Animation.mp4"

sfx_beep = os.path.join(scratch_dir, "video_output/beep.wav")
sfx_bell = os.path.join(scratch_dir, "video_output/bell.wav")
synth_bgm = os.path.join(scratch_dir, "video_output/bgm.wav")

# Generate BGM & SFX if not exist
if not os.path.exists(sfx_beep):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=f=1200:d=0.15",
        "-af", "volume=0.5,afade=t=out:st=0.1:d=0.05", sfx_beep
    ], check=True)

if not os.path.exists(sfx_bell):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=f=880:d=0.8",
        "-f", "lavfi", "-i", "sine=f=1320:d=0.8",
        "-filter_complex", "[0:a][1:a]amix=inputs=2,volume=0.6,afade=t=out:st=0.3:d=0.5[bell]",
        "-map", "[bell]", sfx_bell
    ], check=True)

# Combine Video + Audio in a single pass directly to final MP4
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
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    final_out_2
]

print("Rendering final MP4 with synchronized audio...")
subprocess.run(final_cmd, check=True)

# Copy to user external drive
subprocess.run(["cp", final_out_2, final_out_1], check=True)
print("Final video successfully created in both directories!")
