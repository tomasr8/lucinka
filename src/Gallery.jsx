import { useState } from "react";

export default function GalleryPage() {
    const [images, setImages] = useState([]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages([...images, reader.result]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageDelete = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
    };

    return (
        <div className="gallery-page">
            <h1>Gallery</h1>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <div className="image-grid">
                {images.map((image, index) => (
                    <div key={index} className="image-item">
                        <img src={image} alt={`Uploaded ${index}`} />
                        <button onClick={() => handleImageDelete(index)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}