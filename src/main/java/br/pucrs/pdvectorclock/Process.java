package br.pucrs.pdvectorclock;


import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Builder
@Getter
@Setter
public class Process {
    private String id;
    private String host;
    private String port;
    private int chance;
    private int minDelay;
    private int maxDelay;
    private Map<Integer, Integer> vectorClock;
}
