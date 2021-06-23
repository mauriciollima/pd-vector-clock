package br.pucrs.pdvectorclock;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfigApi {

    @PostMapping("/config")
    public ResponseEntity config() {


        return ResponseEntity.ok(null);
    }

    @PostMapping("/start")
    public ResponseEntity start() {


        return ResponseEntity.ok(null);
    }


}
