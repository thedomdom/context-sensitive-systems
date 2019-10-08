import pandas as pd
from influxdb import InfluxDBClient


def from_db_to_csv():
    # Load Data From Database
    influx = InfluxDBClient(database='training', verify_ssl=False)
    measurement_frame = pd.DataFrame(influx.query('select * from "orientation"')['orientation'])
    measurement_frame.drop('count', axis=1, inplace=True)
    measurement_frame = measurement_frame.set_index('time')
    measurement_frame.index = pd.to_datetime(measurement_frame.index)
    measurement_frame.to_csv('data.csv')
    return measurement_frame


def from_csv():
    # Load Data from csv
    measurement_frame = pd.read_csv('data.csv')
    measurement_frame = measurement_frame.set_index('time')
    measurement_frame.index = pd.to_datetime(measurement_frame.index)
    return measurement_frame


def aggregate(measurement_frame, aggregates=None):
    if aggregates is None:
        aggregates = ['min', 'max', 'median', 'std']
    # Apply Windowing and aggregate data
    aggregated_frame = measurement_frame \
        .drop(['subject', 'label'], axis=1) \
        .groupby(pd.Grouper(freq='1000ms')) \
        .aggregate(aggregates) \
        .dropna()
    # rename columns
    aggregated_frame.columns = [col[0] + "_" + col[1] for col in aggregated_frame.columns]
    # Get Labels for windows
    aggregated_strings = measurement_frame[['subject', 'label']] \
        .groupby(pd.Grouper(freq='1000ms')) \
        .first()
    # Merge DataFrames
    aggregated_frame = aggregated_frame.join(aggregated_strings)
    return aggregated_frame


# noinspection PyPep8Naming
def split_x_y(aggregated_frame):
    # Split the DataFrame into Measurements and Labels
    y = aggregated_frame["label"]
    X = aggregated_frame.drop(["subject", "label"], axis=1)
    return X, y
