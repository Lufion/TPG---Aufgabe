  class LooksPage {
    constructor () {
        this.elTrack = document.querySelector('.details_slider_track');
        this.elSlides = document.querySelectorAll('.details_slide');
        this.elThumbnails = document.querySelectorAll('.details_thumbnail_image');
        this.elArrowLeft = document.querySelector('.image_arrow_left');
        this.elArrowRight  = document.querySelector('.image_arrow_right');

        this.#SliderFunction()
    }

    #SliderFunction() {
        document.addEventListener('DOMContentLoaded', () => {
            let currentIndex = 0;
            const totalSlides = this.elSlides.length;
        
            const updateCarousel = (index) => {
                const offset = -index * 100;
                this.elTrack.style.transform = `translateX(${offset}%)`;
        
                this.elThumbnails.forEach((thumb, i) => {
                thumb.toggleAttribute('selected', i === index);
                });
            };
        
            this.elArrowLeft.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                updateCarousel(currentIndex);
            });
        
            this.elArrowRight.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % totalSlides;
                updateCarousel(currentIndex);
            });
        
            this.elThumbnails.forEach((thumb, index) => {
                thumb.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel(currentIndex);
                });
            });
        
            updateCarousel(currentIndex); // initial position
        });
    }

    
  }

  new LooksPage()