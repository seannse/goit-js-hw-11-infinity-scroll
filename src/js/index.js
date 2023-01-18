import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { PixabayAPI } from './pixabay-api.js';
import { createGalleryMarkup } from './create-markup.js';

const refs = {
  formEl: document.querySelector('#search-form'),
  galleryEl: document.querySelector('.gallery'),
  target: document.querySelector('.target'),
};
const simpleLightBox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});
const pixabayApi = new PixabayAPI();

const observer = new IntersectionObserver((entries) => {
  if (!entries[0].isIntersecting) {
    return
  }
  console.log('hello');
  onBtnLoadMoreClick();
},
  {
  root: null,
  rootMargin: '0px 0px 400px 0px',
  threshold: 1.0,
});

refs.formEl.addEventListener('submit', onFormElSubmit);

async function onFormElSubmit(event) {
  event.preventDefault();
  if (pixabayApi.previousValue === event.target.elements.searchQuery.value)
    return

  pixabayApi.previousValue = event.target.elements.searchQuery.value;
  event.target.elements.searchBtn.disabled = true;
  pixabayApi.query = pixabayApi.previousValue;
  pixabayApi.page = 1;

  try {
    onPixabayApiResolvedFirst(await pixabayApi.getPhotos());
    observer.observe(refs.target);
  } catch (error){
    console.log(error);
  } finally {
    event.target.elements.searchBtn.disabled = false;
  }
}

function onPixabayApiResolvedFirst(obj) {
  const { totalHits, hits } = obj.data;

  if (!hits.length) {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    refs.galleryEl.innerHTML = '';
    return;
  }

  refs.galleryEl.innerHTML = createGalleryMarkup(hits);
  Notify.success(`Hooray! We found ${totalHits} images.`);
  simpleLightBox.refresh();
  scrollTo(0, 0);
}

async function onBtnLoadMoreClick() {
  pixabayApi.page += 1;

  try {
    onPixabayApiResolvedMore(await pixabayApi.getPhotos())
  } catch (error){
    console.log(error)
  }
}

function onPixabayApiResolvedMore(obj) {
  const { totalHits, hits } = obj.data;

  refs.galleryEl.insertAdjacentHTML('beforeend', createGalleryMarkup(hits));
  simpleLightBox.refresh();
  onSmoothScroll();

  if (!hits.length) {
    Notify.info("We're sorry, but you've reached the end of search results.");
  };
}

function onSmoothScroll() {
  const { height: cardHeight } =
    refs.galleryEl.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight,
    behavior: 'smooth',
  });
}
