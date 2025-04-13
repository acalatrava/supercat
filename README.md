# SuperGato

Este juego es el resultado de una divertida sesión de "vibecoding" realizada con mis hijos de 5 y 8 años.

## Origen del Proyecto

La idea surgió como un ejercicio para explorar juntos la creación de videojuegos usando Three.js. Queríamos hacer algo sencillo pero emocionante, ¡y qué mejor que un gato valiente en una aventura!

### Gráficos

Lo más especial de los gráficos es que nacieron de la imaginación de los niños:

1.  **Dibujos Originales:** El gato protagonista, los enemigos y el castillo final fueron dibujados primero en papel por los peques.
2.  **Digitalización con IA:** Luego, utilizamos la ayuda de ChatGPT para convertir esos dibujos en los archivos de sprites (imágenes digitales con fondo transparente) que se usan en el juego.

### Sonidos

¡La banda sonora y los efectos son totalmente caseros!

*   **Efectos de Sonido:** Las colisiones, la caída a la lava y los sonidos de los enemigos al pasar fueron grabados directamente por los niños, ¡aportando su toque único!
*   **Música de Fondo:** Para la música ambiental, utilizamos una pista libre de derechos de Pixabay:
    *   Título: Stranger Things
    *   Autor: UNIVERSFIELD
    *   Enlace: [https://pixabay.com/es/music/sintetizador-stranger-things-124008/](https://pixabay.com/es/music/sintetizador-stranger-things-124008/)

## Cómo Jugar

1.  Necesitas un servidor web local simple para ejecutar el juego debido al uso de módulos de JavaScript.
    *   Si tienes Python: `python3 -m http.server` en la carpeta del proyecto y abre `http://localhost:8000`.
    *   Si tienes Node.js: `npx http-server` en la carpeta y abre la URL que te indique.
2.  Usa las **flechas izquierda/derecha** del teclado o los **botones en pantalla** (en móvil) para mover al gato.
3.  Esquiva a los enemigos que se acercan.
4.  No te salgas del camino hacia la lava roja.
5.  ¡Intenta llegar al castillo al final del recorrido!

## Ajustar dificultad

Ajusta las variables de los enemigos para hacerlo más difícil:
```
// Enemies
const numEnemies = 20;
const enemyHorizontalSpeed = 1.0;
const collisionDistance = .7;
const enemyActivationDistanceZ = 10;
const minEnemySpacing = 8;
const maxEnemySpacing = 40;
```

## ¡Gracias por jugar!

Este proyecto fue, sobre todo, una experiencia de aprendizaje y diversión en familia. 