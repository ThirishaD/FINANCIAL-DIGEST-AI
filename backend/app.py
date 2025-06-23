from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

# ✅ Load .env file
load_dotenv()

# ✅ Get API keys from environment
fmp_api_key = os.getenv("FMP_API_KEY")
gemini_api_key = os.getenv("GEMINI_API_KEY")

# ✅ Configure Gemini correctly
genai.configure(api_key=gemini_api_key)

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "✅ FMP-based Financial Digest AI backend is running!"})


@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    company_name = data.get('company', '').strip()

    if not company_name:
        return jsonify({"error": "Company name is required"}), 400

    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        # Step 1: Search ticker
        search_url = f"https://financialmodelingprep.com/api/v3/search?query={company_name}&limit=1&exchange=NASDAQ&apikey={fmp_api_key}"
        search_response = requests.get(search_url, headers=headers)

        if search_response.status_code != 200 or not search_response.json():
            return jsonify({"error": "Company not found in FMP"}), 404

        ticker_data = search_response.json()[0]
        symbol = ticker_data.get("symbol")

        # Step 2: Fetch company profile
        profile_url = f"https://financialmodelingprep.com/api/v3/profile/{symbol}?apikey={fmp_api_key}"
        profile = requests.get(profile_url, headers=headers).json()[0]

        # Step 3: Fetch income statement (latest 5 years for historical trends)
        income_url = f"https://financialmodelingprep.com/api/v3/income-statement/{symbol}?limit=5&apikey={fmp_api_key}"
        income_data = requests.get(income_url, headers=headers).json()
        latest_income = income_data[0] if len(income_data) > 0 else {}
        prev_income = income_data[1] if len(income_data) > 1 else None
        latest_year = str(latest_income.get("calendarYear", "latest"))
        prev_year = str(prev_income.get("calendarYear", "prev")) if prev_income else None

        # Step 4: Fetch cash flow statement (latest 5 years)
        cashflow_url = f"https://financialmodelingprep.com/api/v3/cash-flow-statement/{symbol}?limit=5&apikey={fmp_api_key}"
        cashflow_data = requests.get(cashflow_url, headers=headers).json()

        # Step 5: Fetch competitors (industry peers)
        industry = profile.get("industry", None)
        competitors = []
        industry_insights = None
        if industry:
            peer_url = f"https://financialmodelingprep.com/api/v3/stock-screener?industry={industry}&limit=5&apikey={fmp_api_key}"
            peer_data = requests.get(peer_url, headers=headers).json()
            competitors = [p for p in peer_data if p.get("symbol") != symbol]
            # Fetch financials for each competitor
            competitor_metrics = []
            for comp in competitors:
                comp_symbol = comp.get("symbol")
                comp_profile_url = f"https://financialmodelingprep.com/api/v3/profile/{comp_symbol}?apikey={fmp_api_key}"
                comp_profile = requests.get(comp_profile_url, headers=headers).json()
                comp_income_url = f"https://financialmodelingprep.com/api/v3/income-statement/{comp_symbol}?limit=1&apikey={fmp_api_key}"
                comp_income = requests.get(comp_income_url, headers=headers).json()
                if comp_profile and comp_income:
                    comp_profile = comp_profile[0]
                    comp_income = comp_income[0]
                    competitor_metrics.append({
                        "symbol": comp_symbol,
                        "company": comp_profile.get("companyName", comp_symbol),
                        "revenue": comp_income.get("revenue", 0),
                        "netIncome": comp_income.get("netIncome", 0),
                        "grossMargins": comp_income.get("grossProfit", 0) / comp_income.get("revenue", 1),
                        "profitMargins": comp_income.get("netIncome", 0) / comp_income.get("revenue", 1),
                        "marketCap": comp_profile.get("mktCap", 0)
                    })
            # Industry insights: compare main company to competitors
            industry_insights = {
                "competitors": competitor_metrics
            }

        # Step 6: Market share (for automobile industry only)
        market_share = None
        if industry and "automobile" in industry.lower():
            # Calculate market share based on revenue among top 5 peers
            all_revenues = [latest_income.get("revenue", 0)] + [c["revenue"] for c in industry_insights["competitors"]]
            total_revenue = sum(all_revenues)
            if total_revenue > 0:
                market_share = {
                    "company": round(latest_income.get("revenue", 0) / total_revenue * 100, 2),
                    "competitors": [round(c["revenue"] / total_revenue * 100, 2) for c in industry_insights["competitors"]]
                }

        # Step 7: Historical trends
        historical_trends = {
            "years": [i.get("calendarYear") for i in reversed(income_data)],
            "revenue": [i.get("revenue", 0) for i in reversed(income_data)],
            "netIncome": [i.get("netIncome", 0) for i in reversed(income_data)],
            "grossMargins": [i.get("grossProfit", 0) / i.get("revenue", 1) for i in reversed(income_data)],
            "profitMargins": [i.get("netIncome", 0) / i.get("revenue", 1) for i in reversed(income_data)]
        }
        cash_flow_trend = {
            "years": [c.get("calendarYear") for c in reversed(cashflow_data)],
            "operating": [c.get("operatingCashFlow", 0) for c in reversed(cashflow_data)],
            "investing": [c.get("cashflowFromInvestment", 0) for c in reversed(cashflow_data)],
            "financing": [c.get("cashflowFromFinancing", 0) for c in reversed(cashflow_data)]
        }

        # Step 8: Extract required fields from latest year
        financial_data = {
            "company": profile.get("companyName", company_name),
            "symbol": symbol,
            "sector": profile.get("sector", "N/A"),
            "industry": industry,
            "marketCap": profile.get("mktCap", 0),
            "revenue": latest_income.get("revenue", 0),
            "netIncome": latest_income.get("netIncome", 0),
            "grossMargins": latest_income.get("grossProfit", 0) / latest_income.get("revenue", 1),
            "profitMargins": latest_income.get("netIncome", 0) / latest_income.get("revenue", 1),
            "peRatio": profile.get("pe", None),
            "pbRatio": profile.get("priceToBookRatio", None),
            "historicalTrends": historical_trends,
            "cashFlow": cash_flow_trend,
            "industryInsights": industry_insights,
            "marketShare": market_share
        }

        # Step 5: Gemini Comments
        model = genai.GenerativeModel("gemini-1.5-flash")
        comment_prompt = f"""
You are a financial analyst. Provide a one-sentence insight for each metric below.
Return valid JSON with keys: revenue, netIncome, grossMargins, profitMargins, peRatio, pbRatio

- Revenue: {financial_data['revenue']}
- Net Income: {financial_data['netIncome']}
- Gross Margins: {financial_data['grossMargins']}
- Profit Margins: {financial_data['profitMargins']}
- PE Ratio: {financial_data['peRatio']}
- PB Ratio: {financial_data['pbRatio']}
"""
        def extract_json(text):
            # Remove Markdown code block formatting if present
            if text.strip().startswith('```'):
                text = text.strip().split('\n', 1)[-1]  # Remove the first line (```json or ```
                if text.endswith('```'):
                    text = text.rsplit('```', 1)[0]
            return text.strip()

        try:
            comment_response = model.generate_content(comment_prompt)
            try:
                cleaned = extract_json(comment_response.text)
                financial_data["comments"] = json.loads(cleaned)
            except Exception as json_err:
                print("Comment Generation Error: Invalid JSON from Gemini:", comment_response.text)
                print("JSON decode error:", json_err)
                # Retry: Ask Gemini to fix the output and return only valid JSON
                retry_prompt = f"""
The following is not valid JSON. Please correct it and return only valid JSON with keys: revenue, netIncome, grossMargins, profitMargins, peRatio, pbRatio. Do not include any extra text.

Original output:
{comment_response.text.strip()}
"""
                retry_response = model.generate_content(retry_prompt)
                try:
                    cleaned_retry = extract_json(retry_response.text)
                    financial_data["comments"] = json.loads(cleaned_retry)
                except Exception as retry_json_err:
                    print("Retry Comment Generation Error: Invalid JSON from Gemini:", retry_response.text)
                    print("JSON decode error:", retry_json_err)
                    return jsonify({"error": "Failed to generate valid comments from Gemini."}), 500
        except Exception as e:
            print("Comment Generation Error:", e)
            return jsonify({"error": "Failed to generate comments."}), 500

        # Step 6: Forecast (real data only, with year keys)
        try:
            if prev_income:
                rev_prev = prev_income.get("revenue", 0)
                ni_prev = prev_income.get("netIncome", 0)
                revenue_growth = (financial_data["revenue"] - rev_prev) / rev_prev if rev_prev else 0
                net_income_growth = (financial_data["netIncome"] - ni_prev) / ni_prev if ni_prev else 0
            else:
                rev_prev = None
                ni_prev = None
                revenue_growth = 0
                net_income_growth = 0

            # Predict next year based on latest growth
            if latest_year.isdigit():
                next_year = str(int(latest_year) + 1)
            else:
                next_year = "next"

            financial_data["forecast"] = {
                prev_year: {"revenue": rev_prev, "netIncome": ni_prev} if prev_income else None,
                latest_year: {"revenue": financial_data["revenue"], "netIncome": financial_data["netIncome"]},
                next_year: {
                    "revenue": round(financial_data["revenue"] * (1 + revenue_growth), 2),
                    "netIncome": round(financial_data["netIncome"] * (1 + net_income_growth), 2)
                }
            }
        except Exception as e:
            print("Forecast Error:", e)
            return jsonify({"error": "Forecast generation failed."}), 500

        # Step 7: Insight
        insight_prompt = f"""
Write 3 professional financial insight bullet points based on this company:
- Sector: {financial_data['sector']}
- Market Cap: {financial_data['marketCap']}
- Revenue: {financial_data['revenue']}
- Net Income: {financial_data['netIncome']}
- Gross Margins: {financial_data['grossMargins']}
- Profit Margins: {financial_data['profitMargins']}
- PE Ratio: {financial_data['peRatio']}
- PB Ratio: {financial_data['pbRatio']}
Avoid numbers. Focus on trends and sentiment.
"""
        try:
            insight_response = model.generate_content(insight_prompt)
            financial_data["insight"] = insight_response.text.strip()
        except Exception as e:
            print("Insight Generation Error:", e)
            return jsonify({"error": "Insight generation failed."}), 500

        # Step 8: News (FMP doesn't have news in free tier; skip or use another source)
        financial_data["news"] = []  # Optional: integrate another news API

        # Step 9: Graph Inference (real data only)
        try:
            rev = financial_data["revenue"]
            ni = financial_data["netIncome"]
            rev_growth = revenue_growth if prev_income else None
            ni_growth = net_income_growth if prev_income else None
            if rev_growth is not None and ni_growth is not None:
                if rev_growth > 0 and ni_growth > 0:
                    inference = f"Both revenue and net income have increased compared to last year, indicating positive growth."
                elif rev_growth > 0 and ni_growth < 0:
                    inference = f"Revenue has grown, but net income has decreased, suggesting rising costs or reduced profitability."
                elif rev_growth < 0 and ni_growth > 0:
                    inference = f"Revenue has declined, but net income increased, indicating improved efficiency or cost management."
                else:
                    inference = f"Both revenue and net income have decreased compared to last year, signaling a potential downturn."
            else:
                inference = "Insufficient data to determine growth trends."
            financial_data["graphInference"] = inference
        except Exception as e:
            print("Graph Inference Error:", e)
            financial_data["graphInference"] = "Unable to generate graph inference due to data error."

        # Step 9: Qualitative and additional real-data-based insights
        # All insights are single-line, real-data-based, and concise
        qualitative_factors = f"Industry: {industry or 'N/A'}. Sector: {profile.get('sector', 'N/A')}."
        net_margin = latest_income.get("netIncome", 0) / latest_income.get("revenue", 1)
        company_segregation = f"Company operates in {industry or 'various industries'} with a focus on {profile.get('sector', 'N/A')}."
        future_investments = profile.get('companyDescription', '').split('.')[-2] if profile.get('companyDescription') else 'N/A'
        current_investments = profile.get('companyDescription', '').split('.')[-3] if profile.get('companyDescription') else 'N/A'
        future_demands = f"Demand outlook: {profile.get('sector', 'N/A')} sector expected to grow based on recent trends."
        financial_health = f"Debt/Equity: {profile.get('debtToEquity', 'N/A')}, Current Ratio: {profile.get('currentRatio', 'N/A')}, Quick Ratio: {profile.get('quickRatio', 'N/A')}."
        # Market share already calculated for automobile industry

        # Add all to financial_data
        financial_data["qualitativeFactors"] = qualitative_factors
        financial_data["netMargin"] = net_margin
        financial_data["companySegregation"] = company_segregation
        financial_data["futureInvestments"] = future_investments
        financial_data["currentInvestments"] = current_investments
        financial_data["futureDemands"] = future_demands
        financial_data["financialHealth"] = financial_health

        # Fetch real investments and financial health data
        # Investments: Use capital expenditures and R&D from cash flow/income statement
        capex = None
        rnd = None
        if len(cashflow_data) > 0:
            capex = cashflow_data[0].get('capitalExpenditure')
        if len(income_data) > 0:
            rnd = income_data[0].get('researchAndDevelopmentExpenses')
        financial_data["currentInvestments"] = f"Capital Expenditure: ${capex:,}" if capex is not None else "No data"
        financial_data["futureInvestments"] = f"R&D Expenses: ${rnd:,}" if rnd is not None else "No data"
        # Financial Health: Use real ratios from profile
        debt_to_equity = profile.get('debtToEquity')
        current_ratio = profile.get('currentRatio')
        quick_ratio = profile.get('quickRatio')
        financial_data["financialHealth"] = f"Debt/Equity: {debt_to_equity if debt_to_equity is not None else 'No data'}, Current Ratio: {current_ratio if current_ratio is not None else 'No data'}, Quick Ratio: {quick_ratio if quick_ratio is not None else 'No data'}"

        # Helper for real-data fallback
        def real_or_unavailable(value, label=None):
            if value is None or value == '' or (isinstance(value, (int, float)) and value == 0):
                return f"Not reported by company" if label is None else f"{label}: Not reported by company"
            return value

        # Use helper for all fields that may be missing
        financial_data["grossMargins"] = real_or_unavailable(latest_income.get("grossProfit", None) / latest_income.get("revenue", 1) if latest_income.get("revenue", 1) else None, "Gross Margin")
        financial_data["profitMargins"] = real_or_unavailable(latest_income.get("netIncome", None) / latest_income.get("revenue", 1) if latest_income.get("revenue", 1) else None, "Profit Margin")
        financial_data["peRatio"] = real_or_unavailable(profile.get("pe", None), "PE Ratio")
        financial_data["pbRatio"] = real_or_unavailable(profile.get("priceToBookRatio", None), "PB Ratio")
        financial_data["netMargin"] = real_or_unavailable(latest_income.get("netIncome", None) / latest_income.get("revenue", 1) if latest_income.get("revenue", 1) else None, "Net Margin")
        financial_data["qualitativeFactors"] = real_or_unavailable(financial_data.get("qualitativeFactors", None), "Qualitative Factors")
        financial_data["companySegregation"] = real_or_unavailable(financial_data.get("companySegregation", None), "Company Segregation")
        financial_data["futureInvestments"] = real_or_unavailable(financial_data.get("futureInvestments", None), "Future Investments")
        financial_data["currentInvestments"] = real_or_unavailable(financial_data.get("currentInvestments", None), "Current Investments")
        financial_data["futureDemands"] = real_or_unavailable(financial_data.get("futureDemands", None), "Future Demands")
        financial_data["financialHealth"] = real_or_unavailable(financial_data.get("financialHealth", None), "Financial Health")

        # Step 10: Market Insights (always present, deep, real-data-based)
        try:
            market_insight_prompt = f"""
You are a financial analyst. Based on the following real data, provide 2-3 deep, analytical, and insightful bullet points about this company's financial performance, trends, and risks. Use real numbers and trends, avoid generic statements. If a value is missing, use the best available context or explain why it's missing.

- Company: {financial_data['company']}
- Sector: {financial_data['sector']}
- Industry: {financial_data.get('industry', 'N/A')}
- Market Cap: {financial_data['marketCap']}
- Revenue: {financial_data['revenue']}
- Net Income: {financial_data['netIncome']}
- Gross Margin: {financial_data['grossMargins']}
- Profit Margin: {financial_data['profitMargins']}
- PE Ratio: {financial_data['peRatio']}
- PB Ratio: {financial_data['pbRatio']}
- Debt/Equity: {profile.get('debtToEquity', 'N/A')}
- Current Ratio: {profile.get('currentRatio', 'N/A')}
- Quick Ratio: {profile.get('quickRatio', 'N/A')}
- Historical Revenue: {financial_data['historicalTrends']['revenue']}
- Historical Net Income: {financial_data['historicalTrends']['netIncome']}
- Cash Flow: {financial_data['cashFlow']}
"""
            market_insight_response = model.generate_content(market_insight_prompt)
            financial_data["marketInsights"] = market_insight_response.text.strip()
        except Exception as e:
            print("Market Insights Generation Error:", e)
            financial_data["marketInsights"] = "Unable to generate market insights due to data error."

        # Cash Flow Inference (real data, AI-generated)
        try:
            cashflow_inference_prompt = f"""
You are a financial analyst. Based on the following cash flow data (operating, investing, financing for the last 5 years), provide a concise, real-data-based inference (1-2 sentences) about the company's cash flow trends, strengths, and risks. Use real numbers and trends, avoid generic statements.

Operating Cash Flow: {financial_data['cashFlow']['operating']}
Investing Cash Flow: {financial_data['cashFlow']['investing']}
Financing Cash Flow: {financial_data['cashFlow']['financing']}
Years: {financial_data['cashFlow']['years']}
"""
            cashflow_inference_response = model.generate_content(cashflow_inference_prompt)
            if 'comments' not in financial_data:
                financial_data['comments'] = {}
            financial_data['comments']['cashFlow'] = cashflow_inference_response.text.strip()
        except Exception as e:
            print("Cash Flow Inference Generation Error:", e)

        return jsonify(financial_data)

    except Exception as e:
        print("Critical Error:", e)
        return jsonify({"error": "Server error occurred"}), 500


if __name__ == '__main__':
    app.run(debug=True)
