import { renderToStaticMarkup } from "react-dom/server";

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("mongodb", () => {
  const db = jest.fn(() => ({ name: "mock-db" }));
  const connect = jest.fn(async () => ({ db }));

  return {
    MongoClient: jest.fn().mockImplementation(() => ({ connect, db })),
  };
});

describe("smoke test", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.MONGO_DB_URI = "mongodb://127.0.0.1:27017/orientation-web";
  });

  afterEach(() => {
    delete process.env.MONGO_DB_URI;
  });

  it("renders a basic TSX element", () => {
    const markup = renderToStaticMarkup(<main>Orientation Web</main>);

    expect(markup).toContain("Orientation Web");
    expect(markup).toContain("main");
  });

  it("initializes the MongoDB connection helper", async () => {
    const { getMongoClient, getMongoDb, mongoClientPromise } = await import(
      "../lib/mongodb"
    );

    await expect(getMongoClient()).resolves.toBeDefined();
    await expect(getMongoDb("orientation-web")).resolves.toEqual({
      name: "mock-db",
    });

    await expect(mongoClientPromise).resolves.toBeDefined();
  });
});