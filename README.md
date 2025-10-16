# matrix-chess-widget ♞
### Мультиплеерные шахматы в виджете matrix
Не использует widget-api, т.к. оно пока не работает на телефонах, вместо этого используется токен пользователя, что позволяет играть на любом устройстве, для вашей же безопасности рекомендую сначала форкнуть и деплоить на pages из своего репозитория, но если вы крейзи можете и просто добавить в любой чат вот так
```
/addwidget https://ministr-kaifa.github.io/matrix-chess-widget?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language&matrix_base_url=$org.matrix.msc4039.matrix_base_url&fallback_base_url=https://example.com
```

Только в fallback_base_url=https://example.com поменяйте на адрес вашего сервера, этот параметр нужен потому что на телефоне matrix_base_url может не работать, ну или я че то не так делаю хз

Поддерживает параллельные игровые сессии и в конце игры отправляет в чат фото состояния доски в конце игры

Сама реализация гптшна и сомнительна, можно лучше
