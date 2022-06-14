let topBar;

class TopBar {
    constructor () {
        this._wrapper = document.getElementById("top-box");
        this._toggleButton = document.getElementById("expander");
        this._buttonRow = document.getElementById('button-row');

        this._collapsedTop = 30; // Default, gets overridden
        this._animate = false;

        this._icons = {
            collapse: `
                <span class="material-symbols-rounded">
                    expand_less
                </span>`,
            expand:`
                <span class="material-symbols-rounded">
                    expand_more
                </span>`
        };

        this.expand = this.expand.bind(this);
        this.collapse = this.collapse.bind(this);
        this.toggle = this.toggle.bind(this);

        this._calculateCollapsedTop();
        this._createEaseAnimations();
        this._addEventListeners();
        
        this.expand();
        this._animate = true;
    }

    collapse () {
        if (!this._expanded) return;
        this._expanded = false;
    
        this._wrapper.style.top = `${this._collapsedTop}px`;
        this._toggleButton.innerHTML = this._icons.expand;

        if (!this._animate) return;
    
        this._applyAnimation("collapse");
    }
    
    expand () {
        if (this._expanded) return;
        this._expanded = true;
    
        this._wrapper.style.top = `0`;
        this._toggleButton.innerHTML = this._icons.collapse;

        if (!this._animate) return;
    
        this._applyAnimation("expand");
    }
    
    toggle () {
        if (this._expanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    _calculateCollapsedTop () {
        this._collapsedTop = this._wrapper.getBoundingClientRect().y - this._buttonRow.getBoundingClientRect().y;
    }

    _addEventListeners () {
        this._toggleButton.addEventListener('click', this.toggle);
    }
    
    _applyAnimation (animationName) {
        this._wrapper.classList.remove('top-box--expanded');
        this._wrapper.classList.remove('top-box--collapsed');
    
        // Force a recalc styles here so the classes take hold.
        window.getComputedStyle(this._wrapper).top;
    
        if (animationName === "expand") {
            this._wrapper.classList.add('top-box--expanded');
        } else if (animationName === "collapse") {
            this._wrapper.classList.add('top-box--collapsed');
        }
    }

    _createEaseAnimations() {
        let easingStyles = document.querySelector('.ease-animation');
        if (easingStyles) {
            return easingStyles;
        }

        easingStyles = document.createElement('style');
        easingStyles.classList.add('.ease-animation');

        easingStyles.textContent = `
        @keyframes collapseAnimation {
            from { top: 0; }
            to { top: ${this._collapsedTop}px; }
        }
        @keyframes expandAnimation {
            from { top: ${this._collapsedTop}px; }
            to { top: 0; }
        }
        `;

        document.head.appendChild(easingStyles);
        return easingStyles;
    }
}

document.addEventListener('DOMContentLoaded', () => topBar = new TopBar(), false);
