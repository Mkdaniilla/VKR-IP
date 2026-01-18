import { useState, useEffect } from "react";
import { getProtectedVideo } from "../lib/api";

export default function StartScreen() {
  const [selected, setSelected] = useState<"individual" | "company" | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selected) {
      getProtectedVideo("welcome.mp4")
        .then(url => setVideoUrl(url))
        .catch(err => console.error("Ошибка загрузки видео:", err));
    }
  }, [selected]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      {!selected ? (
        <>
          <h1 className="text-2xl font-bold mb-6 text-center">
            Добро пожаловать! 👋
            <br />
            Выберите, как вы хотите зарегистрировать товарный знак:
          </h1>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button
              onClick={() => setSelected("individual")}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl shadow-md transition"
            >
              Физическое лицо
            </button>

            <button
              onClick={() => setSelected("company")}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl shadow-md transition"
            >
              Юридическое лицо / ИП
            </button>
          </div>
        </>
      ) : (
        <div className="w-full max-w-2xl">
          {videoUrl ? (
            <video className="w-full rounded-lg shadow-lg" controls autoPlay>
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <p className="text-gray-600">Загрузка видео...</p>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                // ⚡ Потом заменим alert() на переход в мастер шагов
                alert(`Старт мастера для: ${selected}`);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl shadow-md transition"
            >
              Перейти к шагам регистрации
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
