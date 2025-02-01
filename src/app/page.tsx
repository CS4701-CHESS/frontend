"use client";

import { useState, useEffect } from "react";
import { Chess, Move, Square } from "chess.js";
import { Chessboard } from "react-chessboard";

interface CustomSquareStyles {
  [square: string]: {
    background: string;
    borderRadius?: string;
  };
}

interface MoveOption {
  from: Square;
  to: Square;
  promotion?: string;
}

export default function Home() {
  const [game, setGame] = useState<Chess>(new Chess());
  const [moveSquares, setMoveSquares] = useState<CustomSquareStyles>({});
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [boardWidth, setBoardWidth] = useState<number>(400);

  useEffect(() => {
    const calculateSize = () => {
      const vh = Math.min(window.innerHeight - 100, window.innerWidth - 40);
      setBoardWidth(vh);
    };

    calculateSize();
    window.addEventListener("resize", calculateSize);
    return () => window.removeEventListener("resize", calculateSize);
  }, []);

  function getMoveOptions(square: Square): void {
    if (!square) return;

    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) {
      setMoveSquares({});
      return;
    }

    const newSquares: CustomSquareStyles = {};
    moves.forEach((move: Move) => {
      newSquares[move.to] = {
        background:
          "radial-gradient(circle, rgba(0,0,0,.35) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setMoveSquares(newSquares);
  }

  function makeAMove(move: MoveOption): Move | null {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      setGame(gameCopy);
      setMoveSquares({});
      setSelectedPiece(null);
      return result;
    } catch (error) {
      return null;
    }
  }

  function onSquareClick(square: Square): void {
    const piece = game.get(square);

    if (selectedPiece) {
      if (square === selectedPiece) {
        setSelectedPiece(null);
        setMoveSquares({});
        return;
      }

      const moveResult = makeAMove({
        from: selectedPiece,
        to: square,
        promotion: "q",
      });

      if (moveResult) {
        return;
      }
    }

    if (piece && piece.color === game.turn()) {
      setSelectedPiece(square);
      getMoveOptions(square);
    }
  }

  function onPieceDragBegin(_piece: string, square: Square): void {
    setSelectedPiece(square);
    getMoveOptions(square);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
    return move !== null;
  }

  function getGameStatus(): string {
    if (game.isGameOver()) {
      if (game.isDraw()) {
        return "Draw!";
      }
      return `${game.turn() === "w" ? "Black" : "White"} wins!`;
    }
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-2">
      <div className="text-lg font-bold mb-2">{getGameStatus()}</div>
      <div style={{ width: boardWidth, height: boardWidth }}>
        <Chessboard
          id="BasicBoard"
          position={game.fen()}
          onSquareClick={onSquareClick}
          onPieceDragBegin={onPieceDragBegin}
          onPieceDrop={onDrop}
          customSquareStyles={moveSquares}
          boardWidth={boardWidth}
        />
      </div>
      {game.isGameOver() && (
        <button
          className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => {
            setGame(new Chess());
            setMoveSquares({});
            setSelectedPiece(null);
          }}
        >
          New Game
        </button>
      )}
    </div>
  );
}
