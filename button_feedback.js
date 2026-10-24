// Gives every button a short visible flash when it is clicked.
// The pressed look while the mouse is down is done in styles.css (:active);
// this adds a flash that stays visible after a quick click.
document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) { return; }
    button.classList.remove("is-clicked");
    void button.offsetWidth; // restart the animation on repeated clicks
    button.classList.add("is-clicked");
    setTimeout(() => button.classList.remove("is-clicked"), 450);
  });