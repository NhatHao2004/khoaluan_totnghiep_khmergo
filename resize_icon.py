from PIL import Image

def pad_image(input_path, output_path, scale=0.66):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # Calculate new size
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        # Resize image
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create a new transparent image with the original size
        new_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        
        # Calculate position to paste the resized image in the center
        x = (width - new_width) // 2
        y = (height - new_height) // 2
        
        # Paste the resized image onto the center of the new image
        new_img.paste(img_resized, (x, y), img_resized)
        
        new_img.save(output_path, "PNG")
        print(f"Successfully generated {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    pad_image("assets/images/icon.png", "assets/images/adaptive-icon.png")
