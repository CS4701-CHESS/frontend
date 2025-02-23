"use client";

import React, { useState, useEffect } from "react";
import { Chess, Move, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import MoveHistory from "../components/MoveHistory";
import EvaluationBar from "../components/EvalBar";
import { ChevronDown } from "lucide-react";

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

interface MoveHistoryI {
  white: string;
  black: string;
  moveNumber: number;
}

interface CapturedPiece {
  type: string;
  color: string;
  value: number;
}

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const PIECE_SYMBOLS_BY_COLOR = {
  black: {
    p: "♙",
    n: "♘",
    b: "♗",
    r: "♖",
    q: "♕",
  },
  white: {
    p: "♟",
    n: "♞",
    b: "♝",
    r: "♜",
    q: "♛",
  },
};

export default function Home() {
  const [game, setGame] = useState<Chess>(new Chess());
  const [moveSquares, setMoveSquares] = useState<CustomSquareStyles>({});
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [boardWidth, setBoardWidth] = useState<number>(400);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryI[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    "white"
  );
  const [capturedPieces, setCapturedPieces] = useState<{
    white: CapturedPiece[];
    black: CapturedPiece[];
  }>({ white: [], black: [] });
  const [dropdownOpen, setDropdownOpen] = useState({
    white: false,
    black: false,
  });
  const [previousPosition, setPreviousPosition] = useState<string>(game.fen());

  useEffect(() => {
    const calculateSize = () => {
      const navbarHeight = 64;
      const statusHeight = 80;
      const controlsHeight = 96;
      const padding = 32;

      const maxBoardSize = 700;
      const maxMoveHistoryWidth = 400;

      const availableHeight = Math.min(
        window.innerHeight -
          navbarHeight -
          statusHeight -
          controlsHeight -
          padding,
        maxBoardSize
      );

      const availableWidth = Math.min(
        (window.innerWidth - maxMoveHistoryWidth) * 0.7,
        maxBoardSize
      );

      const idealSize = Math.min(availableHeight, availableWidth);
      setBoardWidth(Math.max(300, Math.min(idealSize, maxBoardSize)));
    };

    calculateSize();
    window.addEventListener("resize", calculateSize);
    return () => window.removeEventListener("resize", calculateSize);
  }, []);

  function detectCapture(oldFen: string, newFen: string) {
    const oldPosition = new Chess(oldFen);
    const newPosition = new Chess(newFen);
    const oldBoard = oldPosition.board();
    const newBoard = newPosition.board();
    const oldPieces = new Map();
    const newPieces = new Map();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = oldBoard[row][col];
        if (piece) {
          const key = `${piece.color}${piece.type}`;
          oldPieces.set(key, (oldPieces.get(key) || 0) + 1);
        }
      }
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = newBoard[row][col];
        if (piece) {
          const key = `${piece.color}${piece.type}`;
          newPieces.set(key, (newPieces.get(key) || 0) + 1);
        }
      }
    }

    for (const [key, count] of oldPieces.entries()) {
      const newCount = newPieces.get(key) || 0;
      if (newCount < count) {
        const pieceColor = key[0];
        const pieceType = key[1];
        const capturingColor = pieceColor === "w" ? "black" : "white";

        setCapturedPieces((prev) => ({
          ...prev,
          [capturingColor]: [
            ...prev[capturingColor],
            {
              type: pieceType,
              color: pieceColor,
              value: PIECE_VALUES[pieceType] || 0,
            },
          ],
        }));
      }
    }
  }

  function getCurrentTurn(): "white" | "black" {
    return game.turn() === "w" ? "white" : "black";
  }

  function updateMoveHistory(move: Move) {
    const moveColor = move.color;
    const san = move.san;

    setMoveHistory((prev) => {
      if (moveColor === "w") {
        return [
          ...prev,
          {
            moveNumber: prev.length + 1,
            white: san,
            black: "",
          },
        ];
      } else {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1] = {
            ...newHistory[newHistory.length - 1],
            black: san,
          };
        }
        return newHistory;
      }
    });
  }

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
      if (result) {
        detectCapture(game.fen(), gameCopy.fen());
        setPreviousPosition(game.fen());
        updateMoveHistory(result);
        setGame(gameCopy);
        setMoveSquares({});
        setSelectedPiece(null);
      }
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

  function resetGame() {
    setGame(new Chess());
    setMoveSquares({});
    setSelectedPiece(null);
    setMoveHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setPreviousPosition(new Chess().fen());
  }

  function flipBoard() {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  }

  function calculateMaterialDifference(): {
    value: number;
    side: "white" | "black" | null;
  } {
    const whiteCapturedValue = capturedPieces.white.reduce(
      (sum, piece) => sum + piece.value,
      0
    );
    const blackCapturedValue = capturedPieces.black.reduce(
      (sum, piece) => sum + piece.value,
      0
    );

    if (whiteCapturedValue > blackCapturedValue) {
      return { value: whiteCapturedValue - blackCapturedValue, side: "white" };
    } else if (blackCapturedValue > whiteCapturedValue) {
      return { value: blackCapturedValue - whiteCapturedValue, side: "black" };
    }
    return { value: 0, side: null };
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 flex gap-8 justify-center items-start min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="flex items-start">
            <EvaluationBar
              fen={game.fen()}
              height={boardWidth}
              orientation={boardOrientation}
            />
            <div style={{ width: boardWidth }}>
              <div className="flex justify-between items-center mb-2 h-[40px]">
                <div className="relative">
                  <button
                    onClick={() =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        black: !prev.black,
                      }))
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                  >
                    Black Menu <ChevronDown size={20} />
                  </button>
                  {dropdownOpen.black && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 shadow-lg rounded-lg p-2 z-10">
                      <button className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded">
                        Option 1
                      </button>
                      <button className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded">
                        Option 2
                      </button>
                    </div>
                  )}
                </div>

                {capturedPieces.black.length > 0 && (
                  <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded">
                    {capturedPieces.black.map((piece, idx) => (
                      <span key={idx} className="text-2xl text-white">
                        {PIECE_SYMBOLS_BY_COLOR.white[piece.type]}
                      </span>
                    ))}
                    {calculateMaterialDifference().side === "black" && (
                      <span className="text-green-500 font-bold">
                        +{calculateMaterialDifference().value}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Chessboard
                id="BasicBoard"
                position={game.fen()}
                onSquareClick={onSquareClick}
                onPieceDragBegin={onPieceDragBegin}
                onPieceDrop={onDrop}
                customSquareStyles={moveSquares}
                boardWidth={boardWidth}
                boardOrientation={boardOrientation}
              />

              <div className="flex justify-between items-center mt-2 h-[40px]">
                <div className="relative">
                  <button
                    onClick={() =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        white: !prev.white,
                      }))
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    White Menu <ChevronDown size={20} />
                  </button>
                  {dropdownOpen.white && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 shadow-lg rounded-lg p-2 z-10">
                      <button className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded">
                        Option 1
                      </button>
                      <button className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded">
                        Option 2
                      </button>
                    </div>
                  )}
                </div>

                {capturedPieces.white.length > 0 && (
                  <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded">
                    {capturedPieces.white.map((piece, idx) => (
                      <span key={idx} className="text-2xl text-white">
                        {PIECE_SYMBOLS_BY_COLOR.black[piece.type]}
                      </span>
                    ))}
                    {calculateMaterialDifference().side === "white" && (
                      <span className="text-green-500 font-bold">
                        +{calculateMaterialDifference().value}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <MoveHistory
          moves={moveHistory}
          height={boardWidth}
          onFlipBoard={flipBoard}
          onNewGame={resetGame}
          currentTurn={getCurrentTurn()}
        />
      </div>
    </div>
  );
}
