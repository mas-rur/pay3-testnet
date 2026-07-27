# --- build stage ---
FROM rust:1-slim-bookworm AS builder
WORKDIR /app

# Cache dependency builds separately from source changes
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src

COPY src ./src
# Touch main.rs so cargo actually rebuilds it (mtime from COPY can be
# older than the dummy build's output in some overlay filesystems)
RUN touch src/main.rs && cargo build --release

# --- runtime stage ---
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/l1_node /app/l1_node

# Fly.io / Railway / Render all inject or expect a listening port; the
# app itself defaults to 8080 and honors $PORT if set.
EXPOSE 8080
ENV PORT=8080

CMD ["/app/l1_node"]
