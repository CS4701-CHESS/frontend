"use client";

import React, { useState, useEffect } from "react";
import { Chess, Move, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import MoveHistory from "../components/MoveHistory";
import EvaluationBar from "../components/EvalBar";
import BestMove from "../components/BestMove";

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

// AI player types
type PlayerType = "human" | "ai";
type AILevel = 2 | 3 | 4;

export default function Home() {
  const [game, setGame] = useState<Chess>(new Chess());
  const [moveSquares, setMoveSquares] = useState<CustomSquareStyles>({});
  const [bestMoveArrow, setBestMoveArrow] = useState<{
    from: string;
    to: string;
  } | null>(null);
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
  const [previousPosition, setPreviousPosition] = useState<string>(game.fen());
  const [showEvalBar, setShowEvalBar] = useState<boolean>(true);
  const [showBestMove, setShowBestMove] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // AI configuration
  const [whitePlayer, setWhitePlayer] = useState<PlayerType>("human");
  const [blackPlayer, setBlackPlayer] = useState<PlayerType>("ai");
  const [aiLevel, setAiLevel] = useState<AILevel>(2);
  const [aiEvaluation, setAiEvaluation] = useState<number | null>(null);

  // Effect to clear best move arrow when best move is toggled off
  useEffect(() => {
    if (!showBestMove) {
      setBestMoveArrow(null);
    }
  }, [showBestMove]);

  // Effect to handle AI moves
  useEffect(() => {
    const makeAiMove = async () => {
      if (game.isGameOver()) return;

      const currentTurn = game.turn() === "w" ? "white" : "black";
      const currentPlayer = currentTurn === "white" ? whitePlayer : blackPlayer;

      if (currentPlayer === "ai") {
        setIsThinking(true);
        try {
          // Get AI move from backend
          const move = await fetchAiMove(
            game.fen(),
            aiLevel,
            currentTurn === "white"
          );
          if (move) {
            makeAMove({
              from: move.from as Square,
              to: move.to as Square,
              promotion: move.promotion as string | undefined,
            });
          }
        } catch (error) {
          // Error handled silently - no fallback
        } finally {
          setIsThinking(false);
        }
      }
    };

    makeAiMove();
  }, [game, whitePlayer, blackPlayer, aiLevel]);

  // Responsive board sizing
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

  // Function to convert numeric square index to algebraic notation (a1, h8, etc.)
  function indexToSquare(index: number): Square {
    if (index < 0 || index > 63) {
      throw new Error(`Invalid square index: ${index}`);
    }

    const file = String.fromCharCode(97 + (index % 8)); // 'a' through 'h'
    const rank = Math.floor(index / 8) + 1; // 1 through 8

    return `${file}${rank}` as Square;
  }

  // Clean fetchAiMove function with no debugging logs
  async function fetchAiMove(fen: string, depth: number, isWhite: boolean) {
    try {
      // Create request data
      const requestData = {
        fen: fen,
        message: fen,
        depth: depth,
        isWhite: isWhite,
      };

      // Make the request
      const response = await fetch("http://localhost:8000/api/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Get response text
      const responseText = await response.text();

      // Parse the JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response`);
      }

      if (data.move === undefined || data.move === null) {
        throw new Error("AI response missing move data");
      }

      // Set evaluation if provided
      if (data.eval !== undefined) {
        setAiEvaluation(data.eval);
      }

      // Process move data based on its format
      let moveFrom: Square | null = null;
      let moveTo: Square | null = null;
      let promotion: string | undefined = undefined;

      if (typeof data.move === "string") {
        // String format (e.g., "g8f6")
        if (data.move.length >= 4) {
          moveFrom = data.move.substring(0, 2) as Square;
          moveTo = data.move.substring(2, 4) as Square;

          if (data.move.length > 4) {
            promotion = data.move.substring(4, 5);
          }
        } else {
          throw new Error(`Invalid move format: ${data.move}`);
        }
      } else if (typeof data.move === "object" && data.move !== null) {
        // First, check for the format with from/to properties
        if (data.move.from && data.move.to) {
          moveFrom = data.move.from as Square;
          moveTo = data.move.to as Square;
          promotion = data.move.promotion;
        }
        // Second, check for the format with from_square/to_square as numeric indices
        else if (
          data.move.from_square !== undefined &&
          data.move.to_square !== undefined
        ) {
          try {
            moveFrom = indexToSquare(data.move.from_square);
            moveTo = indexToSquare(data.move.to_square);

            if (
              data.move.promotion !== undefined &&
              data.move.promotion !== null
            ) {
              promotion = data.move.promotion;
            }
          } catch (conversionError) {
            throw new Error(`Failed to convert square indices`);
          }
        } else {
          throw new Error("Invalid move object format from AI");
        }
      } else {
        throw new Error(`Unrecognized move format: ${typeof data.move}`);
      }

      if (!moveFrom || !moveTo) {
        throw new Error("Failed to extract valid move coordinates");
      }

      // Create a move object
      const moveObj = {
        from: moveFrom,
        to: moveTo,
        promotion: promotion,
      };

      // Validate the move is legal in the current position
      const gameCopy = new Chess(fen);

      try {
        const validMove = gameCopy.move(moveObj);

        if (validMove) {
          return moveObj;
        } else {
          // Try using the SAN move format
          try {
            const sanMove = new Chess(fen).move(data.move);
            if (sanMove) {
              return {
                from: sanMove.from as Square,
                to: sanMove.to as Square,
                promotion: sanMove.promotion as string | undefined,
              };
            }
          } catch (sanError) {
            // Silent catch - no logging
          }

          throw new Error(`AI returned invalid move`);
        }
      } catch (moveError) {
        throw moveError;
      }
    } catch (error) {
      return null;
    }
  }

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
    // Don't allow moves if it's the AI's turn
    const currentTurn = getCurrentTurn();
    const currentPlayer = currentTurn === "white" ? whitePlayer : blackPlayer;

    if (currentPlayer === "ai" || isThinking) {
      return;
    }

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
    // Don't allow moves if it's the AI's turn
    const currentTurn = getCurrentTurn();
    const currentPlayer = currentTurn === "white" ? whitePlayer : blackPlayer;

    if (currentPlayer === "ai" || isThinking) {
      return;
    }

    setSelectedPiece(square);
    getMoveOptions(square);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    // Don't allow moves if it's the AI's turn
    const currentTurn = getCurrentTurn();
    const currentPlayer = currentTurn === "white" ? whitePlayer : blackPlayer;

    if (currentPlayer === "ai" || isThinking) {
      return false;
    }

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
    return move !== null;
  }

  function getGameStatus(): string {
    if (isThinking) {
      return "AI is thinking...";
    }

    if (game.isGameOver()) {
      if (game.isDraw()) {
        return "Draw!";
      }
      return `${game.turn() === "w" ? "Black" : "White"} wins!`;
    }

    const currentTurn = getCurrentTurn();
    const currentPlayer = currentTurn === "white" ? whitePlayer : blackPlayer;

    return `${
      currentTurn === "white" ? "White" : "Black"
    } to move (${currentPlayer})`;
  }

  function resetGame() {
    setGame(new Chess());
    setMoveSquares({});
    setSelectedPiece(null);
    setMoveHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setPreviousPosition(new Chess().fen());
    setAiEvaluation(null);
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

  function toggleAIControl(color: "white" | "black") {
    if (color === "white") {
      setWhitePlayer((prev) => (prev === "human" ? "ai" : "human"));
    } else {
      setBlackPlayer((prev) => (prev === "human" ? "ai" : "human"));
    }
  }

  function changeAiLevel(level: AILevel) {
    setAiLevel(level);
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 flex gap-8 justify-center items-start min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="flex items-start relative">
            {/* Evaluation Bar */}
            <div
              className={`${
                showEvalBar ? "opacity-100" : "opacity-0 pointer-events-none"
              } transition-opacity duration-300`}
            >
              <EvaluationBar
                fen={game.fen()}
                height={boardWidth}
                orientation={boardOrientation}
                aiEvaluation={aiEvaluation}
              />
            </div>

            <div style={{ width: boardWidth }}>
              {/* Black Controls */}
              <div className="flex justify-between items-center mb-2 h-[40px]">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">Black:</span>
                  <button
                    onClick={() => toggleAIControl("black")}
                    className={`px-4 py-2 rounded text-white transition-colors ${
                      blackPlayer === "ai"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {blackPlayer === "ai" ? "AI" : "Human"}
                  </button>
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

              {/* Chessboard */}
              <Chessboard
                id="BasicBoard"
                position={game.fen()}
                onSquareClick={onSquareClick}
                onPieceDragBegin={onPieceDragBegin}
                onPieceDrop={onDrop}
                customSquareStyles={moveSquares}
                boardWidth={boardWidth}
                boardOrientation={boardOrientation}
                customArrows={
                  bestMoveArrow
                    ? [[bestMoveArrow.from, bestMoveArrow.to, "#4ADE80"]]
                    : []
                }
              />

              {/* White Controls */}
              <div className="flex justify-between items-center mt-2 h-[40px]">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">White:</span>
                  <button
                    onClick={() => toggleAIControl("white")}
                    className={`px-4 py-2 rounded text-white transition-colors ${
                      whitePlayer === "ai"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {whitePlayer === "ai" ? "AI" : "Human"}
                  </button>
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

          {/* Best Move Component */}
          <BestMove
            fen={game.fen()}
            visible={showBestMove}
            onMoveSuggestion={(from, to) => {
              if (showBestMove) {
                setBestMoveArrow({ from, to });
              } else {
                setBestMoveArrow(null);
              }
            }}
          />

          {/* Game Status and AI Settings */}
          <div className="mt-4 w-full">
            <div className="bg-gray-800 p-4 rounded-lg w-full">
              <p className="text-white text-center font-medium mb-2">
                {getGameStatus()}
              </p>

              <div className="flex justify-center gap-4 items-center mt-2">
                <div>
                  <span className="text-white mr-2">AI Difficulty:</span>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((level) => (
                      <button
                        key={level}
                        onClick={() => changeAiLevel(level as AILevel)}
                        className={`px-3 py-1 rounded text-white ${
                          aiLevel === level
                            ? "bg-green-600"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                        title={`Depth ${level}: AI looks ${level} moves ahead. Higher = stronger but slower.`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="text-gray-400 text-xs mt-1 text-center">
                    Higher depth = stronger but slower
                  </div>
                </div>
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
          showEvalBar={showEvalBar}
          showBestMove={showBestMove}
          onToggleEvalBar={setShowEvalBar}
          onToggleBestMove={setShowBestMove}
        />
      </div>
    </div>
  );
}
