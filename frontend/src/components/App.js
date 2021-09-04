import React from 'react';
import Footer from './Footer';
import Header from './Header';
import Main from './Main';
import ImagePopup from './ImagePopup';
import { CurrentUserContext } from '../contexts/CurrentUserContext';
import api from '../utils/api';
import EditProfilePopup from './EditProfilePopup';
import EditAvatarPopup from './EditAvatarPopup';
import AddPlacePopup from './AddPlacePopup';
import * as Auth from '../utils/auth';
import Login from './Login';
import { Route, Redirect, Switch, useHistory } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Register from './Register';
import InfoToolTip from './InfoToolTip';
import regIsFine from '../images/yep.svg';
import regIsFailed from '../images/nope.png';

function App() {

  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = React.useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState({});
  const [currentUser, setCurrentUser] = React.useState({});
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const history = useHistory();
  const [message, setMessage] = React.useState({});
  const [isInfoTooltipPopupOpen, setIsInfoTooltipPopupOpen] = React.useState(false);
  const escapeHtml = require('escape-html')


  React.useEffect(() => {
    api.getUserInfo().then(data => setCurrentUser(data))
    .catch(error => api.errorHandler(error));
  }, []);

  React.useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      Auth.getContent(jwt)
        .then((res) => {
          setLoggedIn(true);
          setEmail(res.data.email);
          history.push('/');
        })
        .catch(err => console.log(err));
    }
  }, [history]);

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }
  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }
  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }
  function handleCardClick(card) {
    setSelectedCard(card);
  }

  function handleInfoTooltipPopupOpen() {
    setIsInfoTooltipPopupOpen(true);
  }

  function handleInfoTooltipContent({iconPath, text}) {
    setMessage({ iconPath: iconPath, text: text })
  }

  function closeAllPopups() {
    setSelectedCard({});
    setIsEditAvatarPopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setIsInfoTooltipPopupOpen(false);
    setIsAddPlacePopupOpen(false);

  }

  function handleUpdateAvatar({avatar}) {
    api.editUserAvatar(avatar).then((updatedUser) => {
      setCurrentUser(updatedUser);
      setIsEditAvatarPopupOpen(false);
    })
    .catch(error => api.errorHandler(error));
  }

  function handleUpdateUser({name, about}) {
    api.editUserInfo(name, about).then(() => {
      const updatedUser = { ...currentUser };
        updatedUser.name = name;
        updatedUser.about = about;

        setCurrentUser({ ...updatedUser });
      setIsEditProfilePopupOpen(false);
    })
    .catch(error => api.errorHandler(error));
  }

  React.useEffect(() => {
    api.getInitialCards().then(cardList => {
      setCards(cardList);
    })
    .catch(error => api.errorHandler(error))
  }, []);

  const [cards, setCards] = React.useState([]);

  function handleCardLike(card) {
    const isLiked = card.likes.some(like => like === currentUser._id);
    const changeLike = isLiked ? api.unlikeCard(card._id) : api.likeCard(card._id)
    changeLike.then((newCard) => {
      setCards((newCards) => newCards.map((c) => c._id === card._id ? newCard : c));
    })
    .catch(error => api.errorHandler(error));
  }

  function handleCardDelete(card) {
    api.deleteCard(card._id).then(() => {
      const newCards = cards.filter((c) => c._id !== card._id);
      setCards(newCards);
    })
    .catch(error => api.errorHandler(error));
  }

  function handleAddPlaceSubmit({name, link}) {
    api.plusCard(name, link).then((card) => {
      setCards([card, ...cards]);
      setIsAddPlacePopupOpen(false);
    })
    .catch(error => api.errorHandler(error));
  }

  function registration(email, password) {
    Auth.register(escapeHtml(email), password)
    .then(() => {
        handleInfoTooltipContent({iconPath: regIsFine, text: 'Вы успешно зарегистрировались!'})
        handleInfoTooltipPopupOpen();
        history.push("/signin");
        setTimeout(closeAllPopups, 1000);
    }).catch((err)=> {
      handleInfoTooltipContent({iconPath: regIsFailed, text: 'Что-то пошло не так! Попробуйте ещё раз.'})
      handleInfoTooltipPopupOpen();
      setTimeout(closeAllPopups, 2500);
      console.log(err)
    })
  }
  // Авторизация
  function authorization(email, password) {
    Auth.authorize(escapeHtml(email), password )
    .then((data) => {
      Auth.getContent(data)
        .then((res) => {
          setEmail(res.data.email);
          setCurrentUser(res.data);
          console.log(data);
          setLoggedIn(true);
        })
        .then(()=> {
          handleInfoTooltipContent({iconPath: regIsFine, text: 'Вы успешно авторизовались!'})
        handleInfoTooltipPopupOpen();
         history.push("/");
         setTimeout(closeAllPopups, 1000);
        })

    }).catch((err) => {
      handleInfoTooltipContent({iconPath: regIsFailed, text: 'Что то пошло не так!'})
      handleInfoTooltipPopupOpen();
      console.log(err)
    })
  }

  function handleSignOut() {
    setLoggedIn(false);
    localStorage.removeItem('jwt');
    setEmail('');
    history.push('/signin');
  }

  return (
    <CurrentUserContext.Provider value={currentUser}>
    <div className="mesto">
      <div className="page">
        <Header loggedIn={loggedIn} email={email} handleSignOut={handleSignOut}/>
        <Switch>
        <ProtectedRoute exact path="/" loggedIn={loggedIn} component={Main}
          onEditProfile={handleEditProfileClick}
          onAddPlace={handleAddPlaceClick}
          onEditAvatar={handleEditAvatarClick}
          onCardClick={handleCardClick}
          cards={cards}
          onCardLike={handleCardLike}
          onCardDelete={handleCardDelete}
          />
          <Route path="/signin">
           <Login
           authorization={authorization}
            />
            </Route>
            <Route path="/signup">
            <Register
            registration={registration}
            />
          </Route>
          <Route path="/">
            {loggedIn ? <Redirect to="/" /> : <Redirect to="/signin" />}
          </Route>
        </Switch>
        <Footer />
      </div>

        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
          buttonText="Сохранить"
          />

        <AddPlacePopup
        isOpen={isAddPlacePopupOpen}
        onClose={closeAllPopups}
        onAddPlace={handleAddPlaceSubmit}
        buttonText="Создать"
      />

          <EditAvatarPopup
            isOpen={isEditAvatarPopupOpen}
            onClose={closeAllPopups}
            onUpdateAvatar={handleUpdateAvatar}
            buttonText="Сохранить"
          />

      <ImagePopup
        card={selectedCard}
        onClose={closeAllPopups} />
        <InfoToolTip
         isOpen={isInfoTooltipPopupOpen}
         onClose={closeAllPopups}
         message={message}
        />
        </div>
        </CurrentUserContext.Provider>
  );
}

export default App;