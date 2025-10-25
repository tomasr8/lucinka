import { useState } from "react";

import Header from "./Header";

export default function Gallery() {
  const [images, setImages] = useState([]);

  const handleImageUpload = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages([...images, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = index => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Header isAdmin={false} />
        <div>
          <h1>Gallery</h1>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <div>
            {images.map((image, index) => (
              <div key={index}>
                <img src={image} alt={`Uploaded ${index}`} />
                <button onClick={() => handleImageDelete(index)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
