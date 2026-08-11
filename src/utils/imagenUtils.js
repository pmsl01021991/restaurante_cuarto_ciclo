export const comprimirImagen = (
  archivo,
  maxWidth = 1000,
  calidad = 0.75
) => {
  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = (evento) => {

      const imagen = new Image();

      imagen.onload = () => {

        let width = imagen.width;
        let height = imagen.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const contexto = canvas.getContext("2d");

        contexto.drawImage(
          imagen,
          0,
          0,
          width,
          height
        );

        const base64 = canvas.toDataURL(
          "image/jpeg",
          calidad
        );

        resolve(base64);
      };

      imagen.onerror = reject;

      imagen.src = evento.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(archivo);
  });
};