CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PORTFOLIOS TABLE
CREATE TABLE portfolios (
    portfolio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    portfolio_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_portfolio UNIQUE (user_id, portfolio_name)
);

-- 3. INSTRUMENTS MASTER TABLE
CREATE TABLE instruments (
    instrument_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    isin VARCHAR(12) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    exchange VARCHAR(10) DEFAULT 'NSE',
    sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TRANSACTION TYPES ENUM
CREATE TYPE transaction_type_enum AS ENUM (
    'BUY', 'SELL', 'SPLIT', 'BONUS', 'DIVIDEND', 'BUYBACK', 'DEMERGER', 'RIGHTS_ISSUE'
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL REFERENCES instruments(instrument_id),
    type transaction_type_enum NOT NULL,
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity >= 0),
    price_per_share NUMERIC(15, 4) DEFAULT 0.0000 CHECK (price_per_share >= 0),
    brokerage NUMERIC(10, 2) DEFAULT 0.00,
    stt NUMERIC(10, 2) DEFAULT 0.00,
    other_charges NUMERIC(10, 2) DEFAULT 0.00,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CORPORATE ACTION LOGS
CREATE TABLE corporate_action_logs (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    ratio_old INTEGER,
    ratio_new INTEGER,
    demerger_cost_ratio NUMERIC(5, 4),
    resulting_instrument_id UUID REFERENCES instruments(instrument_id)
);

-- 6. FIFO HOLDINGS LEDGER
CREATE TABLE holdings_fifo (
    holding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL REFERENCES instruments(instrument_id),
    buy_transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    buy_date DATE NOT NULL,
    remaining_quantity NUMERIC(15, 4) NOT NULL CHECK (remaining_quantity >= 0),
    cost_per_share NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_transactions_portfolio ON transactions(portfolio_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_holdings_fifo_lookup ON holdings_fifo(portfolio_id, instrument_id);
