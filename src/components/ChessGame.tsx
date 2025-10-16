import { Chess } from 'chess.js';
import html2canvas from "html2canvas";
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Chessboard, type PieceDropHandlerArgs } from 'react-chessboard';

type ChessGameProps = {
  moveHandler: (move: PieceDropHandlerArgs, gameState: GameState) => boolean;
  isWhite: boolean;
};

export type GameState = {
  isCheck: boolean,
  isMate: boolean,
  isPat: boolean,
  asciiSate: string
}

export const ChessGame = forwardRef<ChessGameHandle, ChessGameProps>(
  ({ moveHandler, isWhite }, ref) => {
    const chessGameRef = useRef(new Chess());
    const chessGame = chessGameRef.current;
    const [chessPosition, setChessPosition] = useState(chessGame.fen());
    const boardRef = useRef<HTMLDivElement>(null);

    async function getBoardBlob(): Promise<Blob | null> {
      const el = boardRef.current;
      if (!el) return null;
      const canvas = await html2canvas(el);
      return await new Promise(res => canvas.toBlob(res, "image/png"));
    }

    function handleMove(move: PieceDropHandlerArgs, callHandler: boolean = true): boolean {
      if (!move.targetSquare) return false;
      const isLocalTurn = !callHandler;
      const performableByLocalPlayer = (isWhite === (chessGame.turn() === 'w'));
      try {
        if ((isLocalTurn && performableByLocalPlayer) || (!isLocalTurn && !performableByLocalPlayer)) {
          console.log(`cheating disabled ${JSON.stringify({isWhite, engineWhiteTurn: chessGame.turn() === 'w', callHandler})}`);
          return false;
        }
        chessGame.move({
          from: move.sourceSquare,
          to: move.targetSquare,
          promotion: 'q',
        });
        if (callHandler) {
          const isPerformable = moveHandler(move, {
            isCheck: chessGame.isCheck(),
            isMate: chessGame.isCheckmate(),
            asciiSate: chessGame.ascii(),
            isPat: chessGame.isDraw()
          });
          if (!isPerformable) {
            console.log(`handler refused move`);
            chessGame.undo();
            return false;
          }
        };
        setChessPosition(chessGame.fen());
        return true;
      } catch(e) {
        console.log(`engine refused move ` + e);
        return false;
      }
    }

    useImperativeHandle(ref, () => ({
      handleMove: (move: PieceDropHandlerArgs) => {
        handleMove(move, false);
        return {
          isCheck: chessGame.isCheck(),
          isMate: chessGame.isCheckmate(),
          asciiSate: chessGame.ascii(),
          isPat: chessGame.isDraw()
        };
      },
      getBoardBlob
    }));

    return (
      <div ref={boardRef}>
        <Chessboard
          options={{
            boardOrientation: isWhite ? "white" : "black",
            position: chessPosition,
            onPieceDrop: (move) => handleMove(move, true),
          }}
        />
      </div>
    );
  }
);

export type ChessGameHandle = {
  handleMove: (move: PieceDropHandlerArgs) => GameState;
  getBoardBlob: () => Promise<Blob | null>;
};

