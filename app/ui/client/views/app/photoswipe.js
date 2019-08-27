import { Meteor } from 'meteor/meteor';
import PhotoSwipe from 'photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';
import 'photoswipe/dist/photoswipe.css';
import s from 'underscore.string';
import EXIF from 'exif-js';

Meteor.startup(() => {
	let currentGallery = null;
	const initGallery = (items, options) => {
		if (!currentGallery) {
			currentGallery = new PhotoSwipe(document.getElementById('pswp'), PhotoSwipeUI_Default, items, options);
			currentGallery.listen('destroy', () => {
				currentGallery = null;
			});
			currentGallery.listen('parseVerticalMargin', function(item) {
				if (item.container.className.indexOf('exif-rotate') == -1){
					item.container.className += ' exif-rotate' + item.orientation;
				}
			});

			currentGallery.init();
		}
	};

	const defaultGalleryOptions = {
		bgOpacity: 0.8,
		showHideOpacity: true,
		counterEl: false,
		shareEl: false,
	};

	const createEventListenerFor = (className) => (event) => {
		event.preventDefault();
		event.stopPropagation();

		if (currentGallery) {
			return;
		}

		const galleryOptions = {
			...defaultGalleryOptions,
			index: 0,
			addCaptionHTMLFn(item, captionEl) {
				captionEl.children[0].innerHTML =					`${ s.escapeHTML(item.title) }<br/><small>${ s.escapeHTML(item.description) }</small>`;
				return true;
			},
		};

		const items = Array.from(document.querySelectorAll(className))
			.map((element, i) => {
				if (element === event.currentTarget) {
					galleryOptions.index = i;
				}

				if (element.dataset.src || element.href) {
					const img = new Image();

					img.addEventListener('load', () => {
						if (!currentGallery) {
							return;
						}
						EXIF.getData(img, function() {
							delete currentGallery.items[i].html;
							currentGallery.items[i].src = img.src;
							var srcOrientation = EXIF.getTag(this, "Orientation");
							currentGallery.items[i].orientation = parseInt(srcOrientation);
							currentGallery.items[i].w = img.naturalWidth;
							currentGallery.items[i].h = img.naturalHeight;
							currentGallery.items[i].index = i;
							currentGallery.invalidateCurrItems();
							currentGallery.updateSize(true);
						});
					});

					img.src = element.dataset.src || element.href;

					return {
						html: '',
						title: element.dataset.title || element.title,
						description: element.dataset.description,
					};
				}
				width = element.naturalWidth;
				height = element.naturalHeight;

				return {
					src: element.src,
					w: width,
					h: height,
					index: i,
					orientation: parseInt(element.parentElement.dataset.orientation),
					title: element.dataset.title || element.title,
					description: element.dataset.description,
				};
			});

		initGallery(items, galleryOptions);
	};

	$(document).on('click', '.gallery-item', createEventListenerFor('.gallery-item'));
	$(document).on('click', '.room-files-image', createEventListenerFor('.room-files-image'));
});
