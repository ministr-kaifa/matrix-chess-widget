import { useEffect, useRef, useState } from 'react';
import type { PieceDropHandlerArgs } from 'react-chessboard';
import MatrixClientApi from '../api/matrix/MatrixClientApi';
import { MatrixEventSyncManager } from '../api/matrix/MatrixEventSyncManager';
import { useWidgetParams } from '../context/WidgetParametersContext';
import { ChessGame, type ChessGameHandle, type GameState } from './ChessGame';

export interface ChessMoveEvent extends PieceDropHandlerArgs {
  gameId: string;
}

export interface GameEvent {
  gameId: string, opponent: string, color: "black" | "white" | "rand"
}

export interface FullGameEvent extends GameEvent {
  initiator: string, eventId: string
}

export default function ChessGameManager({ apiToken }: { apiToken: string }) {
  const params = useWidgetParams();
  const chessRef = useRef<ChessGameHandle>(null);
  const currentGameRef = useRef<GameEvent | null>(null);
  const api = new MatrixClientApi({ baseUrl: params.baseUrl!, token: apiToken!, roomId: params.roomId! });
  const eventManager = new MatrixEventSyncManager(api);
  const [inGame, setInGame] = useState(false);
  const [availableGames, setAvailableGames] = useState<FullGameEvent[]>([]);
  const [opponentMessage, setOpponentMessage] = useState("")
  const [surrendered, setSurrendered] = useState(false)
  const inGameRef = useRef(inGame);
  useEffect(() => {
    inGameRef.current = inGame;
  }, [inGame]);

  useEffect(() => {
    eventManager.on("ru.bzgn.chess.move", (event: any) => {
      console.log(`new move: ${JSON.stringify(event)}`)
      if (inGameRef.current) {
        const content: ChessMoveEvent = event.content
        if (content.gameId === currentGameRef.current?.gameId) {
          console.log(`new move by opponent: ${JSON.stringify(event)}`)
          const move: PieceDropHandlerArgs = {
            piece: content.piece,
            sourceSquare: content.sourceSquare,
            targetSquare: content.targetSquare
          }
          console.log(`piece moved: ${content.piece.pieceType}`);
          const afterMoveGameState = chessRef.current!.handleMove(move);
          if (afterMoveGameState.isMate || afterMoveGameState.isPat) {
            const isMyFault = (content.piece.pieceType[0] === 'w') !== (currentGameRef.current.color === "white")
            if (isMyFault) {
              surrender();
            } else {
              currentGameRef.current = null;
              setInGame(false);
            }
          }
        }
      }
    });
    eventManager.on("ru.bzgn.chess.game", (event: { content: GameEvent, sender: string, event_id: string }) => {
      const content: GameEvent = event.content
      if (content.gameId === currentGameRef.current?.gameId) {
        setOpponentMessage(`${params.userId} против ${event.sender}`);
        currentGameRef.current.opponent = event.sender;
      }

      if (content.opponent === "*") {
        console.log(`found new available game: ${JSON.stringify(event)}`)
        setAvailableGames(prev => [...prev, { ...content, initiator: event.sender, eventId: event.event_id }]);
      } else if (event.sender !== params.userId) {
        setAvailableGames(prev => prev.filter(gameEvent => gameEvent.gameId !== content.gameId))
      } else {
        console.log(`found my started game: ${JSON.stringify(event)}`)
        setAvailableGames(prev => prev.filter(gameEvent => gameEvent.gameId !== content.gameId))
        //todo: implement game resume
        //setAvailableGames(prev => [...prev, { ...content, initiator: event.sender, eventId: event.event_id }]);
      }
    });
    eventManager.on("ru.bzgn.chess.loose", (event: { content: { gameId: string }, sender: string, event_id: string }) => {
      const gameId = event.content.gameId
      setAvailableGames(prev => prev.filter(gameEvent => gameEvent.gameId !== gameId))
    });
    eventManager.start();
  }, []);

  async function surrender(asciiState?: string) {
    setSurrendered(true);
    const blob = await chessRef.current?.getBoardBlob();
    let contentUri: string | null = null;

    if (blob) {
      try {
        contentUri = await api.uploadImage(blob);
      } catch (e) {
        console.error("upload failed", e);
      }
    }

    await api.createEvent(params.roomId!, "m.room.message", {
      body: `Я затерпел в шахматах от ${currentGameRef.current?.opponent}${asciiState ? ` вот таким вот матиком:\n${asciiState}` : ""}`,
      msgtype: "m.text",
    })
      .then(async (res) => {
        console.log(`sent loose message: ${JSON.stringify(res, null, 2)}`);
        if (contentUri) {
          await api.createEvent(params.roomId!, "m.room.message", {
            body: "image.png",
            msgtype: "m.image",
            url: contentUri,
            info: { mimetype: "image/png" },
          })
            .then(r => console.log(`sent board image: ${JSON.stringify(r, null, 2)}`))
            .catch(err => console.log("image send failed:", err));
        }
      })
      .catch(err => console.log("text send failed:", err));

    await api.createEvent(params.roomId!, "ru.bzgn.chess.loose", {
      gameId: currentGameRef.current?.gameId
    })
      .then(res => console.log(`sent loose event: ${JSON.stringify(res, null, 2)}`))
      .catch(err => console.log("loose event failed:", err));

    currentGameRef.current = null;
    setInGame(false);
    setSurrendered(false);
  }


  function initiateGame() {
    const game: GameEvent = { gameId: crypto.randomUUID(), opponent: "*", color: Math.random() >= 0.5 ? "white" : "black" }
    api.createEvent(
      params.roomId!,
      "ru.bzgn.chess.game",
      game
    )
      .then(res => console.log(`sent start game: ${JSON.stringify(res, null, 2)}`))
      .catch(err => console.log(err));
    currentGameRef.current = game;
    console.log(`set new current game: ${currentGameRef.current}`)
    const handleGameEvent = (event: { content: GameEvent, sender: string, event_id: string }) => {
      const content: GameEvent = event.content
      if (content.gameId === currentGameRef.current?.gameId && content.opponent === params.userId) {
        setOpponentMessage(`${event.content.opponent} против ${event.sender}`);
        currentGameRef.current.opponent = event.sender
        eventManager.off("ru.bzgn.chess.game", handleGameEvent);
        console.log(`found opponent: ${JSON.stringify(event)}`);
        setInGame(true);
      }
    }
    setInGame(true);
    eventManager.on("ru.bzgn.chess.game", handleGameEvent);
    setOpponentMessage("Ищем соперника")
  }

  function sendMove(move: PieceDropHandlerArgs, gameState: GameState) {
    console.log("gameState: " + JSON.stringify(gameState));
    const moveEvent: ChessMoveEvent = { ...move, gameId: currentGameRef.current?.gameId! };
    if (currentGameRef.current?.opponent !== "*") {
      console.log(`sending move: ${JSON.stringify(moveEvent)}`);
      api.createEvent(
        params.roomId!,
        "ru.bzgn.chess.move",
        moveEvent
      )
        .then(res => console.log(`sent move: ${JSON.stringify(res, null, 2)}`))
        .catch(err => console.log(err));
      return true;
    } else {
      console.log(`no opponent, cant perform move`)
      return false;
    }
  }

  function joinGame(gameEvent: FullGameEvent) {
    console.log(`joining game: ${JSON.stringify(gameEvent)}`);
    currentGameRef.current = {
      gameId: gameEvent.gameId,
      color: gameEvent.color === "white" ? "black" : "white",
      opponent: gameEvent.initiator
    }
    api.createEvent(params.roomId!, "ru.bzgn.chess.game", {
      ...currentGameRef.current,
      "m.relates.to": {
        event_id: gameEvent.eventId,
        rel_type: "ru.bzgn.chess.game.accept"
      }
    })
    setInGame(true);
    setOpponentMessage(`${params.userId} против ${gameEvent.initiator}`);
  }

  console.log(`current game: ${JSON.stringify(currentGameRef.current)}`)
  return (
    <div>
      {inGame ? (
        <>
          <h3>{opponentMessage}</h3>
          <ChessGame
            ref={chessRef}
            isWhite={(currentGameRef.current as GameEvent | null)?.color === "white"}
            moveHandler={sendMove}
          />
          <button onClick={() => surrender()} disabled={surrendered}>Стерпеть</button>
        </>
      ) : (
        <>
          <button onClick={initiateGame}>Создать игру</button>
          {availableGames.map(g => (
            <button key={g.gameId} onClick={() => joinGame(g)}>
              {g.initiator} будет играть за ({g.color})
            </button>
          ))}
        </>
      )}
    </div>
  );

}

