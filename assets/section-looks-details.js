class LooksPage {
  constructor() {
    this.elTrack = document.querySelector(".details_slider_track");
    this.elSlides = document.querySelectorAll(".details_slide");
    this.elThumbnails = document.querySelectorAll(".details_thumbnail_image");
    this.elArrowLeft = document.querySelector(".image_arrow_left");
    this.elArrowRight = document.querySelector(".image_arrow_right");
    this.elAddtoCart = document.querySelectorAll(".details_add_bttn");
    this.elAddToCartAll = document.querySelector(".summary_add_to_cart_all");
    this.elProductCards = document.querySelectorAll(".details_product_card");
    this.elProductCheckboxes = document.querySelectorAll(".details_product_select_box");
    this.elSummaryPrice = document.querySelector(".summary_price");

    this.textNotAvailable = text_not_available;
    this.textAdd = text_add_to_cart;
    this.textArticleSelected = text_article_selected;

    this.#sliderFunction();
    this.#addToCartFunction();
    this.#addToCartAllFunction();
    this.#variantSelectFunction();
    this.#productCheckboxEvent();
  }

  #sliderFunction() {
    document.addEventListener("DOMContentLoaded", () => {
      let currentIndex = 0;
      const totalSlides = this.elSlides.length;

      const updateCarousel = (index) => {
        const offset = -index * 100;
        this.elTrack.style.transform = `translateX(${offset}%)`;

        this.elThumbnails.forEach((thumb, i) => {
          thumb.toggleAttribute("selected", i === index);
        });
      };

      this.elArrowLeft.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel(currentIndex);
      });

      this.elArrowRight.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel(currentIndex);
      });

      this.elThumbnails.forEach((thumb, index) => {
        thumb.addEventListener("click", () => {
          currentIndex = index;
          updateCarousel(currentIndex);
        });
      });

      updateCarousel(currentIndex); // initial position
    });
  }

  // Updates the Cart Bubble Count, whenever an item is added via the quick add button
  #updateCartCountBubble() {
    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => {
        const cartIcon = document.querySelector("#cart-icon-bubble");
        if (!cartIcon) return;

        let countBubble = cartIcon.querySelector(".cart-count-bubble");
        const count = cart.item_count;

        // Create bubble if it does not exist
        if (!countBubble && count > 0) {
          countBubble = document.createElement("div");
          countBubble.className = "cart-count-bubble";

          const countSpan = document.createElement("span");
          countSpan.setAttribute("aria-hidden", "true");
          countSpan.textContent = count;

          countBubble.appendChild(countSpan);
          cartIcon.appendChild(countBubble);
        } else if (countBubble) {
          const countSpan = countBubble.querySelector("span[aria-hidden]");

          if (count > 0) {
            countBubble.classList.remove("hidden");
            if (countSpan) countSpan.textContent = count;
          } else {
            countBubble.classList.add("hidden");
          }
        }
      })
      .catch((err) => console.error("Fehler beim Aktualisieren vom Cart: ", err));
  }

  #updatePrice() {
    let total = 0;

    this.elProductCards.forEach((card) => {
      const checkbox = card.querySelector(".details_product_select_box");
      if (!checkbox?.checked) return;

      const select = card.querySelector(".details_variant_select");
      const selectedOption = select?.options[select.selectedIndex];
      const isAvailable = selectedOption?.dataset.available === "true";

      if (!select || selectedOption.index === 0 || !selectedOption.value || isNaN(selectedOption.value) || !isAvailable) {
        return;
      }

      // Get price from data attribute (assumes it's stored in cents)
      const price = parseInt(selectedOption.dataset.price || "0");
      total += price;
    });

    const formatted = (total / 100).toFixed(2).replace(".", ",") + " €"; // Format to euro with comma
    this.elSummaryPrice.textContent = formatted;
  }

  #updateSelectedCountText() {
    const checkedCount = this.elProductCheckboxes ? Array.from(this.elProductCheckboxes).filter((cb) => cb.checked).length : 0;
    const summaryTextEl = document.querySelector(".summary_text");

    if (summaryTextEl) {
      const text = this.textArticleSelected;
      summaryTextEl.textContent = `${checkedCount} ${text}`;
    }
  }

  async #checkInventoryLimit(selectedOption, elButton) {
    const res = await fetch("/cart.js");
    const cart = await res.json();

    const selectedVariantId = parseInt(selectedOption.value);
    const variantInventory = parseInt(selectedOption.dataset.inventory || "0");

    const existingCartItem = cart.items.find((item) => item.id === selectedVariantId);
    const quantityInCart = existingCartItem ? existingCartItem.quantity : 0;

    if (quantityInCart >= variantInventory) {
      elButton.disabled = true;
      elButton.innerText = this.textNotAvailable;
      return true; // disabled
    }

    return false; // not disabled
  }

  async #updateCardButtons(select) {
    const card = select.closest(".details_product_card");
    const button = card.querySelector(".details_add_bttn");
    const notification = card.querySelector(".details_product_notification");
    const selectedOption = select.options[select.selectedIndex];
    const isAvailable = selectedOption?.dataset.available === "true";

    select.options[0].disabled = true;
    notification?.classList.remove("show");

    if (selectedOption.index === 0 || !selectedOption.value || isNaN(selectedOption.value)) {
      button.disabled = true;
      notification?.classList.add("show");
      return;
    }

    if (!isAvailable) {
      button.disabled = true;
      button.innerText = this.textNotAvailable;
      return;
    }

    const disabled = await this.#checkInventoryLimit(selectedOption, button);
    if (!disabled) {
      button.disabled = false;
      button.innerText = this.textAdd;
    }
  }

  async #updateAddAllButton() {
    let hasValidVariant = false;
    const cart = await fetch("/cart.js").then((res) => res.json());

    this.elProductCards.forEach((card) => {
      const checkbox = card.querySelector(".details_product_select_box");
      if (!checkbox?.checked) return;

      const select = card.querySelector(".details_variant_select");
      const selectedOption = select?.options[select.selectedIndex];
      const isAvailable = selectedOption?.dataset.available === "true";

      if (selectedOption && selectedOption.index !== 0 && selectedOption.value && !isNaN(selectedOption.value) && isAvailable) {
        const selectedVariantId = parseInt(selectedOption.value);
        const variantInventory = parseInt(selectedOption.dataset.inventory || "0");
        const existingItem = cart.items.find((item) => item.id === selectedVariantId);
        const quantityInCart = existingItem ? existingItem.quantity : 0;

        if (quantityInCart < variantInventory) {
          hasValidVariant = true;
        }
      }
    });

    if (this.elAddToCartAll) {
      this.elAddToCartAll.disabled = !hasValidVariant;
    }
  }

  async #updateButtonStates(elSelect) {
    await this.#updateCardButtons(elSelect); // wait for async inventory check
    await this.#updateAddAllButton(); // ensure inventory info is considered
  }

  #variantSelectFunction() {
    document.querySelectorAll(".details_variant_select").forEach((select) => {
      select.addEventListener("change", () => {
        this.#updateButtonStates(select);
        this.#updatePrice();
      });

      this.#updateButtonStates(select); // run on init
    });
  }

  //Multi Add to cart function for the button at the very bottom of the list
  #addToCartAllFunction() {
    if (this.elAddToCartAll) {
      this.elAddToCartAll.addEventListener("click", () => {
        const itemsToAdd = [];
        let hadInvalidSelection = false;

        this.elProductCards.forEach((card) => {
          const checkbox = card.querySelector(".details_product_select_box");
          if (!checkbox?.checked) return; // Skip unchecked products

          const select = card.querySelector(".details_variant_select");
          const notification = card.querySelector(".details_product_notification");
          const selectedOption = select?.options[select.selectedIndex];
          const isAvailable = selectedOption?.dataset.available === "true";

          notification?.classList.remove("show");

          if (!select || selectedOption.index === 0 || !selectedOption.value || isNaN(selectedOption.value)) {
            notification?.classList.add("show");
            hadInvalidSelection = true;
            return;
          }

          if (!isAvailable) return;

          itemsToAdd.push({ id: selectedOption.value, quantity: 1 });
        });

        if (hadInvalidSelection || itemsToAdd.length === 0) return;

        fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsToAdd }),
        })
          .then((response) => (response.ok ? response.json() : Promise.reject()))
          .then(() => {
            this.#updateCartCountBubble();

            // Re-check inventory limits for the selected items
            this.elProductCards.forEach((card) => {
              const checkbox = card.querySelector(".details_product_select_box");
              if (!checkbox?.checked) return;

              const button = card.querySelector(".details_add_bttn");
              const select = card.querySelector(".details_variant_select");
              const selectedOption = select?.options[select.selectedIndex];
              this.#checkInventoryLimit(selectedOption, button);
            });
          })
          .catch((err) => {
            console.error("Error multi add to cart:", err);
          });
      });
    }
  }

  //Single Add to cart function for each individual card button in the list
  #addToCartFunction() {
    // Individual Add to Cart buttons
    this.elAddtoCart.forEach((elBttn) => {
      elBttn.addEventListener("click", () => {
        const card = elBttn.closest(".details_product_card");
        const select = card.querySelector(".details_variant_select");
        const notification = card.querySelector(".details_product_notification");
        const selectedOption = select?.options[select.selectedIndex];
        const button = card.querySelector(".details_add_bttn");
        notification?.classList.remove("show");

        if (selectedOption.dataset.available !== "true") return;

        const variantId = selectedOption.value;

        fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
        })
          .then((response) => (response.ok ? response.json() : Promise.reject()))
          .then(() => {
            this.#updateCartCountBubble();
            this.#checkInventoryLimit(selectedOption, button);
          })
          .catch((err) => {
            console.error("Fehler beim Hinzufügen:", err);
          });
      });
    });
  }

  //When a checkbox is ticked, update the summary price accordinglgy
  #productCheckboxEvent() {
    this.elProductCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.#updatePrice();
        this.#updateAddAllButton();
        this.#updateSelectedCountText();
      });
    });
  }
}

new LooksPage();
