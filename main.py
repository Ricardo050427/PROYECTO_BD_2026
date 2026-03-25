import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import json

SQLALCHEMY_DATABASE_URL = "sqlite:///./reservaciones.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ReservaDB(Base):
    __tablename__ = "reservaciones"

    id = Column(Integer, primary_key=True, index=True)
    solicitante = Column(String, index=True)
    evento = Column(String)
    fecha = Column(String)
    hora_inicio = Column(String)
    hora_fin = Column(String)
    asistentes = Column(Integer)
    acomodo = Column(String)
    salas = Column(String)
    requerimientos = Column(String)

Base.metadata.create_all(bind=engine)

class ReservacionInput(BaseModel):
    solicitante: str
    evento: str
    fecha: str
    hora_inicio: str
    hora_fin: str
    asistentes: int
    acomodo: str
    salas: List[int]
    requerimientos: List[str]

app = FastAPI(title="API Gestión de Salas Unison")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/reservaciones")
def guardar_reservacion(reserva: ReservacionInput, db: Session = Depends(get_db)):
    nueva_reserva = ReservaDB(
        solicitante=reserva.solicitante,
        evento=reserva.evento,
        fecha=reserva.fecha,
        hora_inicio=reserva.hora_inicio,
        hora_fin=reserva.hora_fin,
        asistentes=reserva.asistentes,
        acomodo=reserva.acomodo,
        salas=json.dumps(reserva.salas),
        requerimientos=json.dumps(reserva.requerimientos)
    )

    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    return {"estatus": "exito", "mensaje": "Reservación guardada en DB", "id": nueva_reserva.id}


@app.get("/api/reservaciones")
def ver_reservaciones(db: Session = Depends(get_db)):
    reservas = db.query(ReservaDB).all()
    resultado = []
    for r in reservas:
        resultado.append({
            "id": r.id,
            "solicitante": r.solicitante,
            "evento": r.evento,
            "fecha": r.fecha,
            "hora_inicio": r.hora_inicio,
            "hora_fin": r.hora_fin,
            "asistentes": r.asistentes,
            "acomodo": r.acomodo,
            "salas": json.loads(r.salas),
            "requerimientos": json.loads(r.requerimientos)
        })
    return resultado

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)